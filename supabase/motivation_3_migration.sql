-- =====================================================
-- AcademyCraft Motivation 3.0 Migration
-- Transforms if-then rewards (Motivation 2.0) to
-- autonomy/mastery/purpose (Motivation 3.0)
-- =====================================================

-- =====================================================
-- SKILL AREAS (for Skill Constellations)
-- Categories of learning for mastery tracking
-- =====================================================
CREATE TABLE public.skill_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  icon TEXT DEFAULT 'star',
  color TEXT DEFAULT '#4AEDD9',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default skill areas for CERMAT preparation
INSERT INTO public.skill_areas (name, name_en, description, icon, color, display_order) VALUES
  ('Matematika', 'Mathematics', 'Čísla, geometrie, logické úlohy', 'calculator', '#FCEE4B', 1),
  ('Český jazyk', 'Czech Language', 'Gramatika, pravopis, porozumění textu', 'book-open', '#4AEDD9', 2),
  ('Obecné předpoklady', 'General Aptitude', 'Logické myšlení, prostorová představivost', 'brain', '#FF55FF', 3);

-- =====================================================
-- SKILL PROGRESS (replaces XP/Levels)
-- Tracks mastery in each skill area
-- =====================================================
CREATE TABLE public.skill_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_area_id UUID NOT NULL REFERENCES public.skill_areas(id) ON DELETE CASCADE,
  mastery_level TEXT DEFAULT 'exploring'
    CHECK (mastery_level IN ('exploring', 'growing', 'confident', 'teaching')),
  activities_completed INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_area_id)
);

CREATE INDEX idx_skill_progress_user_id ON public.skill_progress(user_id);

-- =====================================================
-- LEARNING DAYS (replaces Streak with no-punishment tracking)
-- Tracks learning activity without reset penalty
-- =====================================================
CREATE TABLE public.learning_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  learning_date DATE NOT NULL,
  activities_count INTEGER DEFAULT 1,
  reflection_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, learning_date)
);

CREATE INDEX idx_learning_days_user_id ON public.learning_days(user_id);
CREATE INDEX idx_learning_days_date ON public.learning_days(learning_date);

-- =====================================================
-- FAMILY ADVENTURES (replaces Shop)
-- Shared family goals instead of personal currency
-- =====================================================
CREATE TABLE public.family_adventures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Parent's profile ID
  name TEXT NOT NULL,
  description TEXT,
  points_needed INTEGER NOT NULL,
  points_current INTEGER DEFAULT 0,
  icon TEXT DEFAULT 'star',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'archived')),
  achieved_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_family_adventures_family_id ON public.family_adventures(family_id);
CREATE INDEX idx_family_adventures_status ON public.family_adventures(status);

-- =====================================================
-- ADVENTURE CONTRIBUTIONS (replaces Purchases)
-- Tracks how children contribute to family adventures
-- =====================================================
CREATE TABLE public.adventure_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  adventure_id UUID NOT NULL REFERENCES public.family_adventures(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.completed_activities(id) ON DELETE SET NULL,
  points_contributed INTEGER NOT NULL,
  contributed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_adventure_contributions_adventure_id ON public.adventure_contributions(adventure_id);
CREATE INDEX idx_adventure_contributions_user_id ON public.adventure_contributions(user_id);

-- =====================================================
-- RECOGNITIONS (Now-That instead of If-Then rewards)
-- Unexpected acknowledgment after effort
-- =====================================================
CREATE TABLE public.recognitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recognition_type TEXT NOT NULL CHECK (recognition_type IN ('parent_note', 'effort_spotlight', 'surprise_celebration', 'milestone')),
  title TEXT,
  message TEXT NOT NULL,
  related_activity_id UUID REFERENCES public.completed_activities(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  viewed_at TIMESTAMPTZ
);

CREATE INDEX idx_recognitions_user_id ON public.recognitions(user_id);
CREATE INDEX idx_recognitions_viewed ON public.recognitions(viewed_at) WHERE viewed_at IS NULL;

-- =====================================================
-- WEEKLY REFLECTIONS
-- Self-assessment and parent dialogue
-- =====================================================
CREATE TABLE public.weekly_reflections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  what_learned TEXT,
  what_challenged TEXT,
  what_enjoyed TEXT,
  weekly_goal TEXT,
  goal_met BOOLEAN,
  parent_note TEXT,
  parent_responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

CREATE INDEX idx_weekly_reflections_user_id ON public.weekly_reflections(user_id);

-- =====================================================
-- PROFILE UPDATES for Motivation 3.0
-- =====================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS adventure_points INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weekly_goal_days INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS preferred_learning_time TEXT,
  ADD COLUMN IF NOT EXISTS learning_rhythm_milestone TEXT;

-- =====================================================
-- ACTIVITY UPDATES for Motivation 3.0
-- =====================================================
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS skill_area_id UUID REFERENCES public.skill_areas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS adventure_points INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS purpose_message TEXT;

-- Update existing activities with skill areas and purpose messages
UPDATE public.activities SET
  skill_area_id = (SELECT id FROM public.skill_areas WHERE name = 'Obecné předpoklady'),
  adventure_points = 50,
  purpose_message = 'Každý test ti ukáže, jak daleko jsi došla a kam můžeš růst dál.'
WHERE name = 'CERMAT Test (celý)';

UPDATE public.activities SET
  skill_area_id = (SELECT id FROM public.skill_areas WHERE name = 'Obecné předpoklady'),
  adventure_points = 40,
  purpose_message = 'Logické myšlení ti pomůže řešit problémy nejen ve škole, ale i v životě!'
WHERE name = 'Scio Test';

UPDATE public.activities SET
  skill_area_id = (SELECT id FROM public.skill_areas WHERE name = 'Obecné předpoklady'),
  adventure_points = 20,
  purpose_message = 'Ptát se je super! Nejlepší studenti se nebojí požádat o pomoc.'
WHERE name = 'Doučování (1 hodina)';

UPDATE public.activities SET
  skill_area_id = (SELECT id FROM public.skill_areas WHERE name = 'Obecné předpoklady'),
  adventure_points = 10,
  purpose_message = '20 minut denně dělá velký rozdíl! Mozek se učí postupně.'
WHERE name = 'Domácí příprava (20 min)';

UPDATE public.activities SET
  skill_area_id = (SELECT id FROM public.skill_areas WHERE name = 'Obecné předpoklady'),
  adventure_points = 5,
  purpose_message = 'Chyby jsou učitelé! Když pochopíš, proč se stala, příště to zvládneš.'
WHERE name = 'Oprava chyby';

-- =====================================================
-- RLS POLICIES FOR NEW TABLES
-- =====================================================

-- Enable RLS
ALTER TABLE public.skill_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_adventures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adventure_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recognitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reflections ENABLE ROW LEVEL SECURITY;

-- SKILL_AREAS: Anyone can read
CREATE POLICY "Anyone can view skill areas"
  ON public.skill_areas FOR SELECT
  USING (true);

-- SKILL_PROGRESS: Users see own, parents see children's
CREATE POLICY "Users can view own skill progress"
  ON public.skill_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Parents can view children skill progress"
  ON public.skill_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = skill_progress.user_id
      AND profiles.parent_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own skill progress"
  ON public.skill_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skill progress"
  ON public.skill_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- LEARNING_DAYS: Users see own, parents see children's
CREATE POLICY "Users can view own learning days"
  ON public.learning_days FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Parents can view children learning days"
  ON public.learning_days FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = learning_days.user_id
      AND profiles.parent_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own learning days"
  ON public.learning_days FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning days"
  ON public.learning_days FOR UPDATE
  USING (auth.uid() = user_id);

-- FAMILY_ADVENTURES: Family members can see, parents can manage
CREATE POLICY "Parents can view own family adventures"
  ON public.family_adventures FOR SELECT
  USING (auth.uid() = family_id);

CREATE POLICY "Children can view family adventures"
  ON public.family_adventures FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.parent_id = family_adventures.family_id
    )
  );

CREATE POLICY "Parents can manage family adventures"
  ON public.family_adventures FOR ALL
  USING (auth.uid() = family_id);

-- ADVENTURE_CONTRIBUTIONS: Users see own, parents see children's
CREATE POLICY "Users can view own contributions"
  ON public.adventure_contributions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Parents can view children contributions"
  ON public.adventure_contributions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = adventure_contributions.user_id
      AND profiles.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view family adventure contributions"
  ON public.adventure_contributions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.family_adventures
      WHERE family_adventures.id = adventure_contributions.adventure_id
      AND family_adventures.family_id = auth.uid()
    )
  );

-- RECOGNITIONS: Users see own, parents manage for children
CREATE POLICY "Users can view own recognitions"
  ON public.recognitions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own recognitions (mark as viewed)"
  ON public.recognitions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Parents can manage children recognitions"
  ON public.recognitions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = recognitions.user_id
      AND profiles.parent_id = auth.uid()
    )
  );

-- WEEKLY_REFLECTIONS: Users see own, parents see/respond to children's
CREATE POLICY "Users can view own weekly reflections"
  ON public.weekly_reflections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own weekly reflections"
  ON public.weekly_reflections FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Parents can view children weekly reflections"
  ON public.weekly_reflections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = weekly_reflections.user_id
      AND profiles.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can respond to children weekly reflections"
  ON public.weekly_reflections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = weekly_reflections.user_id
      AND profiles.parent_id = auth.uid()
    )
  );

-- =====================================================
-- FUNCTION: Approve activity (Motivation 3.0 version)
-- Awards adventure points and updates skill progress
-- =====================================================
CREATE OR REPLACE FUNCTION public.approve_activity_v3(
  p_activity_id UUID,
  p_approver_id UUID,
  p_approved BOOLEAN,
  p_recognition_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_activity_uuid UUID;
  v_score INTEGER;
  v_adventure_points INTEGER;
  v_skill_area_id UUID;
  v_parent_id UUID;
  v_active_adventure_id UUID;
BEGIN
  -- Get the completed activity details
  SELECT user_id, activity_id, score
  INTO v_user_id, v_activity_uuid, v_score
  FROM public.completed_activities
  WHERE id = p_activity_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Activity not found or already processed';
  END IF;

  IF p_approved = FALSE THEN
    -- Reject the activity
    UPDATE public.completed_activities
    SET
      status = 'rejected',
      reviewed_at = NOW(),
      reviewed_by = p_approver_id
    WHERE id = p_activity_id;
    RETURN;
  END IF;

  -- Get activity details
  SELECT adventure_points, skill_area_id
  INTO v_adventure_points, v_skill_area_id
  FROM public.activities
  WHERE id = v_activity_uuid;

  -- Update the completed activity (keep XP/emeralds for backward compatibility)
  UPDATE public.completed_activities
  SET
    status = 'approved',
    reviewed_at = NOW(),
    reviewed_by = p_approver_id
  WHERE id = p_activity_id;

  -- Get user's parent
  SELECT parent_id INTO v_parent_id
  FROM public.profiles
  WHERE id = v_user_id;

  -- Update user's adventure points
  UPDATE public.profiles
  SET
    adventure_points = adventure_points + v_adventure_points,
    last_activity_date = CURRENT_DATE
  WHERE id = v_user_id;

  -- Record learning day
  INSERT INTO public.learning_days (user_id, learning_date, activities_count)
  VALUES (v_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, learning_date)
  DO UPDATE SET activities_count = learning_days.activities_count + 1;

  -- Update skill progress if skill area is set
  IF v_skill_area_id IS NOT NULL THEN
    INSERT INTO public.skill_progress (user_id, skill_area_id, activities_completed, last_activity_at)
    VALUES (v_user_id, v_skill_area_id, 1, NOW())
    ON CONFLICT (user_id, skill_area_id)
    DO UPDATE SET
      activities_completed = skill_progress.activities_completed + 1,
      last_activity_at = NOW(),
      -- Auto-upgrade mastery based on completed activities
      mastery_level = CASE
        WHEN skill_progress.activities_completed + 1 >= 20 THEN 'teaching'
        WHEN skill_progress.activities_completed + 1 >= 10 THEN 'confident'
        WHEN skill_progress.activities_completed + 1 >= 5 THEN 'growing'
        ELSE 'exploring'
      END;
  END IF;

  -- Contribute to active family adventure if exists
  IF v_parent_id IS NOT NULL THEN
    SELECT id INTO v_active_adventure_id
    FROM public.family_adventures
    WHERE family_id = v_parent_id
    AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_active_adventure_id IS NOT NULL THEN
      -- Add contribution
      INSERT INTO public.adventure_contributions (adventure_id, user_id, activity_id, points_contributed)
      VALUES (v_active_adventure_id, v_user_id, p_activity_id, v_adventure_points);

      -- Update adventure progress
      UPDATE public.family_adventures
      SET points_current = points_current + v_adventure_points
      WHERE id = v_active_adventure_id;

      -- Check if adventure is achieved
      UPDATE public.family_adventures
      SET status = 'achieved', achieved_at = NOW()
      WHERE id = v_active_adventure_id
      AND points_current >= points_needed
      AND status = 'active';
    END IF;
  END IF;

  -- Create recognition if message provided (now-that recognition)
  IF p_recognition_message IS NOT NULL AND p_recognition_message != '' THEN
    INSERT INTO public.recognitions (user_id, recognition_type, title, message, related_activity_id, created_by)
    VALUES (v_user_id, 'parent_note', 'Zpráva od rodiče', p_recognition_message, p_activity_id, p_approver_id);
  END IF;

END;
$$;

-- =====================================================
-- FUNCTION: Get learning rhythm stats
-- Returns weekly activity pattern without punishment
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_learning_rhythm(
  p_user_id UUID,
  p_weeks INTEGER DEFAULT 4
)
RETURNS TABLE(
  learning_date DATE,
  activities_count INTEGER,
  week_number INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ld.learning_date,
    ld.activities_count,
    EXTRACT(WEEK FROM ld.learning_date)::INTEGER as week_number
  FROM public.learning_days ld
  WHERE ld.user_id = p_user_id
  AND ld.learning_date >= CURRENT_DATE - (p_weeks * 7)
  ORDER BY ld.learning_date DESC;
END;
$$;

-- =====================================================
-- FUNCTION: Calculate learning rhythm milestone
-- =====================================================
CREATE OR REPLACE FUNCTION public.calculate_rhythm_milestone(
  p_user_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_weeks_with_3plus INTEGER;
  v_total_weeks INTEGER;
  v_days_this_week INTEGER;
BEGIN
  -- Count weeks with 3+ active days in last 8 weeks
  SELECT COUNT(DISTINCT week_num) INTO v_weeks_with_3plus
  FROM (
    SELECT DATE_TRUNC('week', learning_date) as week_num, COUNT(*) as day_count
    FROM public.learning_days
    WHERE user_id = p_user_id
    AND learning_date >= CURRENT_DATE - 56
    GROUP BY DATE_TRUNC('week', learning_date)
    HAVING COUNT(*) >= 3
  ) weekly_counts;

  -- Count days this week
  SELECT COUNT(*) INTO v_days_this_week
  FROM public.learning_days
  WHERE user_id = p_user_id
  AND learning_date >= DATE_TRUNC('week', CURRENT_DATE);

  -- Determine milestone
  IF v_weeks_with_3plus >= 8 THEN
    RETURN 'learning_is_life'; -- "Učení je součást mého života"
  ELSIF v_weeks_with_3plus >= 4 THEN
    RETURN 'regular_student'; -- "Pravidelná studentka"
  ELSIF v_days_this_week >= 3 THEN
    RETURN 'found_rhythm'; -- "Našla jsem svůj rytmus"
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

-- =====================================================
-- SEED: Default Family Adventures templates
-- Parents can use these as inspiration
-- =====================================================
CREATE TABLE IF NOT EXISTS public.adventure_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  suggested_points INTEGER NOT NULL,
  icon TEXT DEFAULT 'star',
  category TEXT DEFAULT 'general'
);

INSERT INTO public.adventure_templates (name, description, suggested_points, icon, category) VALUES
  ('Rodinný herní večer', 'Společný večer s deskovými hrami', 50, 'dice', 'together'),
  ('Vaříme spolu', 'Dítě vybere recept a vaříme společně', 100, 'chef-hat', 'together'),
  ('Filmový večer s popcornem', 'Dítě vybere film, připravíme občerstvení', 200, 'film', 'together'),
  ('Výlet do přírody', 'Společná procházka, výlet na kole, nebo piknik', 300, 'trees', 'outdoor'),
  ('Návštěva zajímavého místa', 'Muzeum, aquapark, zoo, nebo jiné místo', 500, 'map-pin', 'outdoor'),
  ('Velké rodinné dobrodružství', 'Víkendový výlet nebo speciální zážitek', 1000, 'compass', 'special');

-- Adventure templates are public
ALTER TABLE public.adventure_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view adventure templates"
  ON public.adventure_templates FOR SELECT
  USING (true);
