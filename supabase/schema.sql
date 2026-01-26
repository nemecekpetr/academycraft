-- =====================================================
-- AcademyCraft Database Schema
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- Extends auth.users with app-specific data
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
  is_banned BOOLEAN NOT NULL DEFAULT FALSE
);

-- Index for parent-child lookups
CREATE INDEX idx_profiles_parent_id ON public.profiles(parent_id);

-- =====================================================
-- ACTIVITIES TABLE
-- Available activities/quests that can be completed
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- COMPLETED_ACTIVITIES TABLE
-- Log of activities completed by users
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

-- Indexes for common queries
CREATE INDEX idx_completed_activities_user_id ON public.completed_activities(user_id);
CREATE INDEX idx_completed_activities_status ON public.completed_activities(status);
CREATE INDEX idx_completed_activities_submitted_at ON public.completed_activities(submitted_at);

-- =====================================================
-- SHOP_ITEMS TABLE
-- Items available for purchase with emeralds
-- =====================================================
CREATE TABLE public.shop_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  icon TEXT NOT NULL DEFAULT 'gift',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- PURCHASES TABLE
-- Log of items purchased by users
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

-- Indexes
CREATE INDEX idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX idx_purchases_status ON public.purchases(status);

-- =====================================================
-- MYSTERY_BOXES TABLE
-- Log of mystery box rewards
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
-- TRIGGER: Create profile on user signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url',
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'student')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completed_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mystery_boxes ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Parents can view their children profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() = parent_id);

CREATE POLICY "Users can update own profile (limited fields)"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ACTIVITIES policies (read-only for all authenticated users)
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

CREATE POLICY "Parents can update children activities (approve/reject)"
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

CREATE POLICY "Parents can update children purchases (fulfill)"
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

-- =====================================================
-- DEFAULT DATA: Activities
-- =====================================================
INSERT INTO public.activities (name, description, xp_reward, emerald_reward, icon, requires_approval, requires_score, max_score, flawless_threshold) VALUES
  ('CERMAT Test (celý)', 'Kompletní přijímací test v časovém limitu', 500, 50, 'scroll', TRUE, TRUE, 50, 40),
  ('Scio Test', 'Test obecných studijních předpokladů', 400, 40, 'brain', TRUE, TRUE, 50, 40),
  ('Doučování (1 hodina)', 'Účast na doučování - online nebo osobně', 200, 20, 'graduation-cap', TRUE, FALSE, NULL, NULL),
  ('Domácí příprava (20 min)', 'Soustředěná práce na procvičování', 100, 10, 'book-open', TRUE, FALSE, NULL, NULL),
  ('Oprava chyby', 'Analýza a pochopení vlastní chyby', 50, 5, 'bug', TRUE, FALSE, NULL, NULL);

-- =====================================================
-- DEFAULT DATA: Shop Items
-- =====================================================
INSERT INTO public.shop_items (name, description, price, icon) VALUES
  ('Sladkost dle výběru', 'Bonbon, čokoláda nebo zmrzlina', 30, 'candy'),
  ('30 min hraní', 'Extra čas na PC, tablet nebo konzoli', 50, 'gamepad-2'),
  ('Výběr filmu na večer', 'Ty vybíráš, co budeme koukat', 80, 'film'),
  ('Vynechání úkolu', 'Jeden domácí úkol ti odpustíme', 100, 'sparkles'),
  ('Výběr večeře', 'Dnes se vaří podle tebe', 150, 'utensils'),
  ('Pizza večer', 'Objednáváme pizzu!', 300, 'pizza'),
  ('100 Kč kapesné', 'Extra peníze do prasátka', 500, 'piggy-bank'),
  ('Výlet dle výběru', 'Zoo, aquapark, nebo jiný výlet', 1000, 'map');

-- =====================================================
-- FUNCTION: Approve or reject activity
-- =====================================================
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

  -- Get activity rewards
  SELECT xp_reward, emerald_reward, flawless_threshold
  INTO v_xp_reward, v_emerald_reward, v_flawless_threshold
  FROM public.activities
  WHERE id = v_activity_uuid;

  -- Check for flawless bonus
  IF v_flawless_threshold IS NOT NULL AND v_score IS NOT NULL AND v_score >= v_flawless_threshold THEN
    v_is_flawless := TRUE;
    v_emerald_reward := v_emerald_reward * 2;
  END IF;

  -- Update the completed activity
  UPDATE public.completed_activities
  SET
    status = 'approved',
    reviewed_at = NOW(),
    reviewed_by = p_approver_id,
    xp_earned = v_xp_reward,
    emeralds_earned = v_emerald_reward,
    is_flawless = v_is_flawless
  WHERE id = p_activity_id;

  -- Award XP and Emeralds to user
  UPDATE public.profiles
  SET
    xp = xp + v_xp_reward,
    emeralds = emeralds + v_emerald_reward,
    last_activity_date = CURRENT_DATE
  WHERE id = v_user_id;

END;
$$;

-- =====================================================
-- FUNCTION: Process purchase
-- =====================================================
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
  -- Get item price
  SELECT price INTO v_price
  FROM public.shop_items
  WHERE id = p_item_id AND is_active = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item not found or not active';
  END IF;

  -- Get user's current emeralds
  SELECT emeralds INTO v_current_emeralds
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_current_emeralds < v_price THEN
    RAISE EXCEPTION 'Insufficient emeralds';
  END IF;

  -- Deduct emeralds
  UPDATE public.profiles
  SET emeralds = emeralds - v_price
  WHERE id = p_user_id;

  -- Create purchase record
  INSERT INTO public.purchases (user_id, item_id, status)
  VALUES (p_user_id, p_item_id, 'pending')
  RETURNING id INTO v_purchase_id;

  RETURN v_purchase_id;
END;
$$;

-- =====================================================
-- FUNCTION: Refund purchase
-- =====================================================
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
  -- Get purchase details
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

  -- Get item price
  SELECT price INTO v_price
  FROM public.shop_items
  WHERE id = v_item_id;

  -- Refund emeralds to user
  UPDATE public.profiles
  SET emeralds = emeralds + v_price
  WHERE id = v_user_id;

  -- Update purchase status
  UPDATE public.purchases
  SET status = 'cancelled'
  WHERE id = p_purchase_id;

END;
$$;

-- =====================================================
-- FUNCTION: Update streak
-- =====================================================
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
    -- Streak broken or first activity
    v_new_streak := 1;
  ELSIF v_last_activity = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Consecutive day
    v_new_streak := v_current_streak + 1;
  ELSE
    -- Same day, no change
    v_new_streak := v_current_streak;
  END IF;

  -- Update profile
  UPDATE public.profiles
  SET
    current_streak = v_new_streak,
    longest_streak = GREATEST(v_longest_streak, v_new_streak),
    last_activity_date = CURRENT_DATE
  WHERE id = p_user_id;

  RETURN v_new_streak;
END;
$$;

-- =====================================================
-- FUNCTION: Link child to parent
-- =====================================================
CREATE OR REPLACE FUNCTION public.link_child_to_parent(
  p_child_id UUID,
  p_parent_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify parent is actually a parent or admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_parent_id
    AND role IN ('parent', 'admin')
  ) THEN
    RAISE EXCEPTION 'User is not a parent';
  END IF;

  -- Verify child exists and is a student
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_child_id
    AND role = 'student'
  ) THEN
    RAISE EXCEPTION 'Child profile not found or not a student';
  END IF;

  -- SECURITY: Check if child already has a parent assigned
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_child_id
    AND parent_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Child already has a parent assigned';
  END IF;

  -- Link child to parent
  UPDATE public.profiles
  SET parent_id = p_parent_id
  WHERE id = p_child_id;

  RETURN TRUE;
END;
$$;
