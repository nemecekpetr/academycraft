-- Activity Date Migration
-- Adds activity_date column to completed_activities to track when activity was performed
-- Run this in Supabase SQL Editor

-- Přidat sloupec activity_date do completed_activities
ALTER TABLE public.completed_activities
  ADD COLUMN IF NOT EXISTS activity_date DATE;

-- Nastavit výchozí hodnotu pro existující záznamy (použije submitted_at)
UPDATE public.completed_activities
SET activity_date = DATE(submitted_at)
WHERE activity_date IS NULL;

-- Nastavit výchozí hodnotu pro nové záznamy
ALTER TABLE public.completed_activities
  ALTER COLUMN activity_date SET DEFAULT CURRENT_DATE;

-- Index pro dotazy podle data aktivity
CREATE INDEX IF NOT EXISTS idx_completed_activities_date
  ON public.completed_activities(activity_date);

-- Index pro kombinované dotazy (user + date)
CREATE INDEX IF NOT EXISTS idx_completed_activities_user_date
  ON public.completed_activities(user_id, activity_date);
