-- Atomic operations for safe concurrent updates
-- Run this in Supabase SQL Editor

-- Function to atomically increment adventure_points
CREATE OR REPLACE FUNCTION increment_adventure_points(
  user_id UUID,
  points_to_add INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_points INTEGER;
BEGIN
  UPDATE profiles
  SET adventure_points = COALESCE(adventure_points, 0) + points_to_add,
      last_activity_date = CURRENT_DATE
  WHERE id = user_id
  RETURNING adventure_points INTO new_points;

  RETURN new_points;
END;
$$;

-- Function to atomically increment emeralds (for refunds)
CREATE OR REPLACE FUNCTION increment_emeralds(
  user_id UUID,
  emeralds_to_add INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_emeralds INTEGER;
BEGIN
  UPDATE profiles
  SET emeralds = COALESCE(emeralds, 0) + emeralds_to_add
  WHERE id = user_id
  RETURNING emeralds INTO new_emeralds;

  RETURN new_emeralds;
END;
$$;

-- Function to atomically decrement emeralds (for purchases)
CREATE OR REPLACE FUNCTION decrement_emeralds(
  user_id UUID,
  emeralds_to_subtract INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_emeralds INTEGER;
  new_emeralds INTEGER;
BEGIN
  SELECT emeralds INTO current_emeralds FROM profiles WHERE id = user_id;

  IF current_emeralds < emeralds_to_subtract THEN
    RAISE EXCEPTION 'Insufficient emeralds';
  END IF;

  UPDATE profiles
  SET emeralds = emeralds - emeralds_to_subtract
  WHERE id = user_id
  RETURNING emeralds INTO new_emeralds;

  RETURN new_emeralds;
END;
$$;

-- Function to approve activity with all side effects in a transaction
CREATE OR REPLACE FUNCTION approve_activity_atomic(
  p_activity_id UUID,
  p_adventure_points INTEGER,
  p_user_id UUID,
  p_skill_area_id UUID DEFAULT NULL,
  p_parent_id UUID DEFAULT NULL,
  p_recognition_message TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_new_points INTEGER;
  v_skill_progress_id UUID;
  v_activities_completed INTEGER;
  v_new_mastery_level TEXT;
  v_active_adventure_id UUID;
  v_adventure_points_current INTEGER;
  v_adventure_points_needed INTEGER;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- 1. Update completed_activities status
  UPDATE completed_activities
  SET status = 'approved',
      reviewed_at = NOW()
  WHERE id = p_activity_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Activity not found or already processed';
  END IF;

  -- 2. Atomically update user's adventure points
  UPDATE profiles
  SET adventure_points = COALESCE(adventure_points, 0) + p_adventure_points,
      last_activity_date = v_today
  WHERE id = p_user_id
  RETURNING adventure_points INTO v_new_points;

  -- 3. Record/update learning day
  INSERT INTO learning_days (user_id, learning_date, activities_count)
  VALUES (p_user_id, v_today, 1)
  ON CONFLICT (user_id, learning_date)
  DO UPDATE SET activities_count = learning_days.activities_count + 1;

  -- 4. Update skill progress if skill_area_id provided
  IF p_skill_area_id IS NOT NULL THEN
    SELECT id, activities_completed INTO v_skill_progress_id, v_activities_completed
    FROM skill_progress
    WHERE user_id = p_user_id AND skill_area_id = p_skill_area_id;

    IF v_skill_progress_id IS NOT NULL THEN
      v_activities_completed := COALESCE(v_activities_completed, 0) + 1;

      -- Calculate mastery level
      v_new_mastery_level := CASE
        WHEN v_activities_completed >= 20 THEN 'teaching'
        WHEN v_activities_completed >= 10 THEN 'confident'
        WHEN v_activities_completed >= 5 THEN 'growing'
        ELSE 'exploring'
      END;

      UPDATE skill_progress
      SET activities_completed = v_activities_completed,
          mastery_level = v_new_mastery_level,
          last_activity_at = NOW()
      WHERE id = v_skill_progress_id;
    ELSE
      INSERT INTO skill_progress (user_id, skill_area_id, activities_completed, mastery_level, last_activity_at)
      VALUES (p_user_id, p_skill_area_id, 1, 'exploring', NOW());
    END IF;
  END IF;

  -- 5. Handle family adventure contribution if parent exists
  IF p_parent_id IS NOT NULL THEN
    SELECT id, points_current, points_needed
    INTO v_active_adventure_id, v_adventure_points_current, v_adventure_points_needed
    FROM family_adventures
    WHERE family_id = p_parent_id AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_active_adventure_id IS NOT NULL THEN
      -- Add contribution
      INSERT INTO adventure_contributions (adventure_id, user_id, activity_id, points_contributed)
      VALUES (v_active_adventure_id, p_user_id, p_activity_id, p_adventure_points);

      -- Update adventure progress
      v_adventure_points_current := COALESCE(v_adventure_points_current, 0) + p_adventure_points;

      IF v_adventure_points_current >= v_adventure_points_needed THEN
        UPDATE family_adventures
        SET points_current = v_adventure_points_current,
            status = 'achieved',
            achieved_at = NOW()
        WHERE id = v_active_adventure_id;
      ELSE
        UPDATE family_adventures
        SET points_current = v_adventure_points_current
        WHERE id = v_active_adventure_id;
      END IF;
    END IF;
  END IF;

  -- 6. Create recognition if message provided
  IF p_recognition_message IS NOT NULL AND p_recognition_message != '' THEN
    INSERT INTO recognitions (user_id, recognition_type, title, message, related_activity_id)
    VALUES (p_user_id, 'parent_note', 'Zprava od rodice', p_recognition_message, p_activity_id);
  END IF;

  -- Return result
  v_result := json_build_object(
    'success', true,
    'new_adventure_points', v_new_points,
    'adventure_points_added', p_adventure_points
  );

  RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_adventure_points TO authenticated;
GRANT EXECUTE ON FUNCTION increment_emeralds TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_emeralds TO authenticated;
GRANT EXECUTE ON FUNCTION approve_activity_atomic TO authenticated;
