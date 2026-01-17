-- =====================================================
-- AcademyCraft - KOMPLETNI RESET DATABAZE
-- Spust tento soubor v Supabase SQL Editoru
-- POZOR: Smaze vsechna data!
-- =====================================================

-- =====================================================
-- KROK 1: SMAZANI VSECH TABULEK
-- =====================================================
DROP TABLE IF EXISTS public.adventure_contributions CASCADE;
DROP TABLE IF EXISTS public.family_adventures CASCADE;
DROP TABLE IF EXISTS public.adventure_templates CASCADE;
DROP TABLE IF EXISTS public.recognitions CASCADE;
DROP TABLE IF EXISTS public.weekly_reflections CASCADE;
DROP TABLE IF EXISTS public.skill_progress CASCADE;
DROP TABLE IF EXISTS public.skill_areas CASCADE;
DROP TABLE IF EXISTS public.learning_days CASCADE;
DROP TABLE IF EXISTS public.mystery_boxes CASCADE;
DROP TABLE IF EXISTS public.purchases CASCADE;
DROP TABLE IF EXISTS public.completed_activities CASCADE;
DROP TABLE IF EXISTS public.activities CASCADE;
DROP TABLE IF EXISTS public.shop_items CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.approve_activity(UUID, UUID, BOOLEAN);
DROP FUNCTION IF EXISTS public.approve_activity_v3(UUID, UUID, BOOLEAN, TEXT);
DROP FUNCTION IF EXISTS public.process_purchase(UUID, UUID);
DROP FUNCTION IF EXISTS public.refund_purchase(UUID);
DROP FUNCTION IF EXISTS public.update_streak(UUID);
DROP FUNCTION IF EXISTS public.link_child_to_parent(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_learning_rhythm(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.calculate_rhythm_milestone(UUID);

-- =====================================================
-- KROK 2: ENABLE EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- KROK 3: PROFILES TABLE
-- =====================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'parent', 'admin')),
  xp INTEGER NOT NULL DEFAULT 0,
  emeralds INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  -- Motivation 3.0 columns
  theme TEXT DEFAULT 'minecraft',
  adventure_points INTEGER DEFAULT 0,
  weekly_goal_days INTEGER DEFAULT 3,
  preferred_learning_time TEXT,
  learning_rhythm_milestone TEXT
);

CREATE INDEX idx_profiles_parent_id ON public.profiles(parent_id);

-- =====================================================
-- KROK 4: SKILL AREAS (Motivation 3.0)
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

INSERT INTO public.skill_areas (name, name_en, description, icon, color, display_order) VALUES
  ('Matematika', 'Mathematics', 'Cisla, geometrie, logicke ulohy', 'calculator', '#FCEE4B', 1),
  ('Cesky jazyk', 'Czech Language', 'Gramatika, pravopis, porozumeni textu', 'book-open', '#4AEDD9', 2),
  ('Obecne predpoklady', 'General Aptitude', 'Logicke mysleni, prostorova predstavivost', 'brain', '#FF55FF', 3);

-- =====================================================
-- KROK 5: ACTIVITIES TABLE
-- =====================================================
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  emerald_reward INTEGER NOT NULL DEFAULT 0,
  icon TEXT NOT NULL DEFAULT 'star',
  requires_approval BOOLEAN NOT NULL DEFAULT TRUE,
  requires_score BOOLEAN NOT NULL DEFAULT FALSE,
  max_score INTEGER,
  flawless_threshold INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Motivation 3.0 columns
  skill_area_id UUID REFERENCES public.skill_areas(id) ON DELETE SET NULL,
  adventure_points INTEGER DEFAULT 10,
  purpose_message TEXT
);

-- =====================================================
-- KROK 6: COMPLETED_ACTIVITIES TABLE
-- =====================================================
CREATE TABLE public.completed_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  score INTEGER,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  emeralds_earned INTEGER NOT NULL DEFAULT 0,
  is_flawless BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_completed_activities_user_id ON public.completed_activities(user_id);
CREATE INDEX idx_completed_activities_status ON public.completed_activities(status);
CREATE INDEX idx_completed_activities_submitted_at ON public.completed_activities(submitted_at);

-- =====================================================
-- KROK 7: SHOP_ITEMS TABLE
-- =====================================================
CREATE TABLE public.shop_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  icon TEXT NOT NULL DEFAULT 'gift',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  min_level INTEGER DEFAULT 1
);

-- =====================================================
-- KROK 8: PURCHASES TABLE
-- =====================================================
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fulfilled_at TIMESTAMPTZ,
  fulfilled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX idx_purchases_status ON public.purchases(status);

-- =====================================================
-- KROK 9: MYSTERY_BOXES TABLE
-- =====================================================
CREATE TABLE public.mystery_boxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('common', 'rare', 'legendary')),
  reward_description TEXT NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  earned_for TEXT NOT NULL DEFAULT 'streak'
);

-- =====================================================
-- KROK 10: SKILL PROGRESS (Motivation 3.0)
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
-- KROK 11: LEARNING DAYS (Motivation 3.0)
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
-- KROK 12: FAMILY ADVENTURES (Motivation 3.0)
-- =====================================================
CREATE TABLE public.family_adventures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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
-- KROK 13: ADVENTURE CONTRIBUTIONS (Motivation 3.0)
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
-- KROK 14: RECOGNITIONS (Motivation 3.0)
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
-- KROK 15: WEEKLY REFLECTIONS (Motivation 3.0)
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
-- KROK 16: ADVENTURE TEMPLATES (Motivation 3.0)
-- =====================================================
CREATE TABLE public.adventure_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  suggested_points INTEGER NOT NULL,
  icon TEXT DEFAULT 'star',
  category TEXT DEFAULT 'general'
);

INSERT INTO public.adventure_templates (name, description, suggested_points, icon, category) VALUES
  ('Rodinny herni vecer', 'Spolecny vecer s deskovymi hrami', 50, 'dice', 'together'),
  ('Varime spolu', 'Dite vybere recept a varime spolecne', 100, 'chef-hat', 'together'),
  ('Filmovy vecer s popcornem', 'Dite vybere film, pripravime obcerstveni', 200, 'film', 'together'),
  ('Vylet do prirody', 'Spolecna prochazka, vylet na kole, nebo piknik', 300, 'trees', 'outdoor'),
  ('Navsteva zajimaveho mista', 'Muzeum, aquapark, zoo, nebo jine misto', 500, 'map-pin', 'outdoor'),
  ('Velke rodinne dobrodruzstvi', 'Vikendovy vylet nebo specialni zazitek', 1000, 'compass', 'special');

-- =====================================================
-- KROK 17: TRIGGER PRO NOVE UZIVATELE
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, full_name, avatar_url, role, theme)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url',
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'student'),
    COALESCE(NEW.raw_user_meta_data ->> 'theme', 'minecraft')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- KROK 18: ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completed_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mystery_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_adventures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adventure_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recognitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adventure_templates ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Parents can view their children profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() = parent_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ACTIVITIES policies
CREATE POLICY "Anyone can view active activities"
  ON public.activities FOR SELECT
  USING (is_active = TRUE);

-- COMPLETED_ACTIVITIES policies
CREATE POLICY "Users can view own completed activities"
  ON public.completed_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Parents can view children completed activities"
  ON public.completed_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = completed_activities.user_id
      AND profiles.parent_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own activities"
  ON public.completed_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Parents can update children activities"
  ON public.completed_activities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = completed_activities.user_id
      AND profiles.parent_id = auth.uid()
    )
  );

-- SHOP_ITEMS policies
CREATE POLICY "Anyone can view active shop items"
  ON public.shop_items FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Parents can manage shop items"
  ON public.shop_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('parent', 'admin')
    )
  );

-- PURCHASES policies
CREATE POLICY "Users can view own purchases"
  ON public.purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Parents can view children purchases"
  ON public.purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = purchases.user_id
      AND profiles.parent_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own purchases"
  ON public.purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Parents can update children purchases"
  ON public.purchases FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = purchases.user_id
      AND profiles.parent_id = auth.uid()
    )
  );

-- MYSTERY_BOXES policies
CREATE POLICY "Users can view own mystery boxes"
  ON public.mystery_boxes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mystery boxes"
  ON public.mystery_boxes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- SKILL_AREAS policies
CREATE POLICY "Anyone can view skill areas"
  ON public.skill_areas FOR SELECT
  USING (true);

-- SKILL_PROGRESS policies
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

-- LEARNING_DAYS policies
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

-- FAMILY_ADVENTURES policies
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

-- ADVENTURE_CONTRIBUTIONS policies
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

-- RECOGNITIONS policies
CREATE POLICY "Users can view own recognitions"
  ON public.recognitions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own recognitions"
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

-- WEEKLY_REFLECTIONS policies
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

-- ADVENTURE_TEMPLATES policies
CREATE POLICY "Anyone can view adventure templates"
  ON public.adventure_templates FOR SELECT
  USING (true);

-- =====================================================
-- KROK 19: FUNCTIONS
-- =====================================================

-- Function: Approve activity (original for backward compatibility)
CREATE OR REPLACE FUNCTION public.approve_activity(
  p_activity_id UUID,
  p_approver_id UUID,
  p_approved BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_activity_uuid UUID;
  v_score INTEGER;
  v_xp_reward INTEGER;
  v_emerald_reward INTEGER;
  v_flawless_threshold INTEGER;
  v_is_flawless BOOLEAN := FALSE;
BEGIN
  SELECT user_id, activity_id, score
  INTO v_user_id, v_activity_uuid, v_score
  FROM public.completed_activities
  WHERE id = p_activity_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Activity not found or already processed';
  END IF;

  IF p_approved = FALSE THEN
    UPDATE public.completed_activities
    SET status = 'rejected', reviewed_at = NOW(), reviewed_by = p_approver_id
    WHERE id = p_activity_id;
    RETURN;
  END IF;

  SELECT xp_reward, emerald_reward, flawless_threshold
  INTO v_xp_reward, v_emerald_reward, v_flawless_threshold
  FROM public.activities
  WHERE id = v_activity_uuid;

  IF v_flawless_threshold IS NOT NULL AND v_score IS NOT NULL AND v_score >= v_flawless_threshold THEN
    v_is_flawless := TRUE;
    v_emerald_reward := v_emerald_reward * 2;
  END IF;

  UPDATE public.completed_activities
  SET status = 'approved', reviewed_at = NOW(), reviewed_by = p_approver_id,
      xp_earned = v_xp_reward, emeralds_earned = v_emerald_reward, is_flawless = v_is_flawless
  WHERE id = p_activity_id;

  UPDATE public.profiles
  SET xp = xp + v_xp_reward, emeralds = emeralds + v_emerald_reward, last_activity_date = CURRENT_DATE
  WHERE id = v_user_id;
END;
$$;

-- Function: Approve activity v3 (Motivation 3.0)
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
  SELECT user_id, activity_id, score
  INTO v_user_id, v_activity_uuid, v_score
  FROM public.completed_activities
  WHERE id = p_activity_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Activity not found or already processed';
  END IF;

  IF p_approved = FALSE THEN
    UPDATE public.completed_activities
    SET status = 'rejected', reviewed_at = NOW(), reviewed_by = p_approver_id
    WHERE id = p_activity_id;
    RETURN;
  END IF;

  SELECT adventure_points, skill_area_id
  INTO v_adventure_points, v_skill_area_id
  FROM public.activities
  WHERE id = v_activity_uuid;

  UPDATE public.completed_activities
  SET status = 'approved', reviewed_at = NOW(), reviewed_by = p_approver_id
  WHERE id = p_activity_id;

  SELECT parent_id INTO v_parent_id
  FROM public.profiles
  WHERE id = v_user_id;

  UPDATE public.profiles
  SET adventure_points = adventure_points + v_adventure_points, last_activity_date = CURRENT_DATE
  WHERE id = v_user_id;

  INSERT INTO public.learning_days (user_id, learning_date, activities_count)
  VALUES (v_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, learning_date)
  DO UPDATE SET activities_count = learning_days.activities_count + 1;

  IF v_skill_area_id IS NOT NULL THEN
    INSERT INTO public.skill_progress (user_id, skill_area_id, activities_completed, last_activity_at)
    VALUES (v_user_id, v_skill_area_id, 1, NOW())
    ON CONFLICT (user_id, skill_area_id)
    DO UPDATE SET
      activities_completed = skill_progress.activities_completed + 1,
      last_activity_at = NOW(),
      mastery_level = CASE
        WHEN skill_progress.activities_completed + 1 >= 20 THEN 'teaching'
        WHEN skill_progress.activities_completed + 1 >= 10 THEN 'confident'
        WHEN skill_progress.activities_completed + 1 >= 5 THEN 'growing'
        ELSE 'exploring'
      END;
  END IF;

  IF v_parent_id IS NOT NULL THEN
    SELECT id INTO v_active_adventure_id
    FROM public.family_adventures
    WHERE family_id = v_parent_id AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_active_adventure_id IS NOT NULL THEN
      INSERT INTO public.adventure_contributions (adventure_id, user_id, activity_id, points_contributed)
      VALUES (v_active_adventure_id, v_user_id, p_activity_id, v_adventure_points);

      UPDATE public.family_adventures
      SET points_current = points_current + v_adventure_points
      WHERE id = v_active_adventure_id;

      UPDATE public.family_adventures
      SET status = 'achieved', achieved_at = NOW()
      WHERE id = v_active_adventure_id
      AND points_current >= points_needed
      AND status = 'active';
    END IF;
  END IF;

  IF p_recognition_message IS NOT NULL AND p_recognition_message != '' THEN
    INSERT INTO public.recognitions (user_id, recognition_type, title, message, related_activity_id, created_by)
    VALUES (v_user_id, 'parent_note', 'Zprava od rodice', p_recognition_message, p_activity_id, p_approver_id);
  END IF;
END;
$$;

-- Function: Process purchase
CREATE OR REPLACE FUNCTION public.process_purchase(
  p_user_id UUID,
  p_item_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_price INTEGER;
  v_current_emeralds INTEGER;
  v_purchase_id UUID;
BEGIN
  SELECT price INTO v_price
  FROM public.shop_items
  WHERE id = p_item_id AND is_active = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item not found or not active';
  END IF;

  SELECT emeralds INTO v_current_emeralds
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_current_emeralds < v_price THEN
    RAISE EXCEPTION 'Insufficient emeralds';
  END IF;

  UPDATE public.profiles
  SET emeralds = emeralds - v_price
  WHERE id = p_user_id;

  INSERT INTO public.purchases (user_id, item_id, status)
  VALUES (p_user_id, p_item_id, 'pending')
  RETURNING id INTO v_purchase_id;

  RETURN v_purchase_id;
END;
$$;

-- Function: Refund purchase
CREATE OR REPLACE FUNCTION public.refund_purchase(
  p_purchase_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_item_id UUID;
  v_price INTEGER;
  v_status TEXT;
BEGIN
  SELECT user_id, item_id, status
  INTO v_user_id, v_item_id, v_status
  FROM public.purchases
  WHERE id = p_purchase_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase not found';
  END IF;

  IF v_status != 'pending' THEN
    RAISE EXCEPTION 'Purchase already processed';
  END IF;

  SELECT price INTO v_price
  FROM public.shop_items
  WHERE id = v_item_id;

  UPDATE public.profiles
  SET emeralds = emeralds + v_price
  WHERE id = v_user_id;

  UPDATE public.purchases
  SET status = 'cancelled'
  WHERE id = p_purchase_id;
END;
$$;

-- Function: Update streak
CREATE OR REPLACE FUNCTION public.update_streak(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_activity DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_new_streak INTEGER;
BEGIN
  SELECT last_activity_date, current_streak, longest_streak
  INTO v_last_activity, v_current_streak, v_longest_streak
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_last_activity IS NULL OR v_last_activity < CURRENT_DATE - INTERVAL '1 day' THEN
    v_new_streak := 1;
  ELSIF v_last_activity = CURRENT_DATE - INTERVAL '1 day' THEN
    v_new_streak := v_current_streak + 1;
  ELSE
    v_new_streak := v_current_streak;
  END IF;

  UPDATE public.profiles
  SET current_streak = v_new_streak,
      longest_streak = GREATEST(v_longest_streak, v_new_streak),
      last_activity_date = CURRENT_DATE
  WHERE id = p_user_id;

  RETURN v_new_streak;
END;
$$;

-- Function: Link child to parent
CREATE OR REPLACE FUNCTION public.link_child_to_parent(
  p_child_id UUID,
  p_parent_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_parent_id AND role IN ('parent', 'admin')
  ) THEN
    RAISE EXCEPTION 'User is not a parent';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_child_id AND role = 'student'
  ) THEN
    RAISE EXCEPTION 'Child profile not found or not a student';
  END IF;

  UPDATE public.profiles
  SET parent_id = p_parent_id
  WHERE id = p_child_id;

  RETURN TRUE;
END;
$$;

-- Function: Get learning rhythm
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

-- Function: Calculate rhythm milestone
CREATE OR REPLACE FUNCTION public.calculate_rhythm_milestone(
  p_user_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_weeks_with_3plus INTEGER;
  v_days_this_week INTEGER;
BEGIN
  SELECT COUNT(DISTINCT week_num) INTO v_weeks_with_3plus
  FROM (
    SELECT DATE_TRUNC('week', learning_date) as week_num, COUNT(*) as day_count
    FROM public.learning_days
    WHERE user_id = p_user_id
    AND learning_date >= CURRENT_DATE - 56
    GROUP BY DATE_TRUNC('week', learning_date)
    HAVING COUNT(*) >= 3
  ) weekly_counts;

  SELECT COUNT(*) INTO v_days_this_week
  FROM public.learning_days
  WHERE user_id = p_user_id
  AND learning_date >= DATE_TRUNC('week', CURRENT_DATE);

  IF v_weeks_with_3plus >= 8 THEN
    RETURN 'learning_is_life';
  ELSIF v_weeks_with_3plus >= 4 THEN
    RETURN 'regular_student';
  ELSIF v_days_this_week >= 3 THEN
    RETURN 'found_rhythm';
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

-- =====================================================
-- KROK 20: SEED DATA - ACTIVITIES
-- =====================================================
INSERT INTO public.activities (name, description, xp_reward, emerald_reward, icon, requires_approval, requires_score, max_score, flawless_threshold, skill_area_id, adventure_points, purpose_message) VALUES
  ('CERMAT Test (cely)', 'Kompletni prijimaci test v casovem limitu', 500, 50, 'scroll', TRUE, TRUE, 50, 40,
   (SELECT id FROM public.skill_areas WHERE name = 'Obecne predpoklady'), 50,
   'Kazdy test ti ukaze, jak daleko jsi dosla a kam muzes rust dal.'),
  ('Scio Test', 'Test obecnych studijnich predpokladu', 400, 40, 'brain', TRUE, TRUE, 50, 40,
   (SELECT id FROM public.skill_areas WHERE name = 'Obecne predpoklady'), 40,
   'Logicke mysleni ti pomuze resit problemy nejen ve skole, ale i v zivote!'),
  ('Doucovani (1 hodina)', 'Ucast na doucovani - online nebo osobne', 200, 20, 'graduation-cap', TRUE, FALSE, NULL, NULL,
   (SELECT id FROM public.skill_areas WHERE name = 'Obecne predpoklady'), 20,
   'Ptat se je super! Nejlepsi studenti se neboji pozadat o pomoc.'),
  ('Domaci priprava (20 min)', 'Soustredena prace na procvicovani', 100, 10, 'book-open', TRUE, FALSE, NULL, NULL,
   (SELECT id FROM public.skill_areas WHERE name = 'Obecne predpoklady'), 10,
   '20 minut denne dela velky rozdil! Mozek se uci postupne.'),
  ('Oprava chyby', 'Analyza a pochopeni vlastni chyby', 50, 5, 'bug', TRUE, FALSE, NULL, NULL,
   (SELECT id FROM public.skill_areas WHERE name = 'Obecne predpoklady'), 5,
   'Chyby jsou ucitele! Kdyz pochopis, proc se stala, priste to zvladnes.');

-- =====================================================
-- KROK 21: SEED DATA - SHOP ITEMS
-- =====================================================
INSERT INTO public.shop_items (name, description, price, icon, min_level) VALUES
  ('Sladkost dle vyberu', 'Bonbon, cokolada nebo zmrzlina', 30, 'candy', 1),
  ('30 min hrani', 'Extra cas na PC, tablet nebo konzoli', 50, 'gamepad-2', 1),
  ('Vyber filmu na vecer', 'Ty vybiras, co budeme koukat', 80, 'film', 1),
  ('Vynechani ukolu', 'Jeden domaci ukol ti odpustime', 100, 'sparkles', 2),
  ('Vyber vecere', 'Dnes se vari podle tebe', 150, 'utensils', 2),
  ('Pizza vecer', 'Jednavame pizzu!', 300, 'pizza', 3),
  ('100 Kc kapesne', 'Extra penize do prasatka', 500, 'piggy-bank', 4),
  ('Vylet dle vyberu', 'Zoo, aquapark, nebo jiny vylet', 1000, 'map', 5);

-- =====================================================
-- HOTOVO!
-- =====================================================
SELECT 'Databaze byla uspesne vytvorena!' as status;
