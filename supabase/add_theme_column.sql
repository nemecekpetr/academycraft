-- Add theme column to profiles
-- Run this in Supabase SQL Editor

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'minecraft';

-- Update the trigger to include theme
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, role, xp, emeralds, theme)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    0,
    0,
    COALESCE(NEW.raw_user_meta_data->>'theme', 'minecraft')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
