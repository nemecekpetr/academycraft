-- Fix legacy link_child_to_parent function
-- Adds check for existing parent to prevent overwriting parent assignments
-- Run this in Supabase SQL Editor

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

  -- SECURITY FIX: Check if child already has a parent assigned
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
