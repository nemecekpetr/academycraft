-- Add min_level column to shop_items
-- Run this in Supabase SQL Editor

ALTER TABLE public.shop_items
ADD COLUMN IF NOT EXISTS min_level INTEGER DEFAULT 1;

-- Update existing items with suggested min_level based on price
UPDATE public.shop_items SET min_level = 1 WHERE price <= 100;
UPDATE public.shop_items SET min_level = 2 WHERE price > 100 AND price <= 200;
UPDATE public.shop_items SET min_level = 3 WHERE price > 200 AND price <= 400;
UPDATE public.shop_items SET min_level = 4 WHERE price > 400 AND price <= 750;
UPDATE public.shop_items SET min_level = 5 WHERE price > 750;
