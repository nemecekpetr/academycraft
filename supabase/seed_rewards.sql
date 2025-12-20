-- Seed file for shop rewards
-- Run this in Supabase SQL Editor

-- First, clear existing items (optional - uncomment if you want to reset)
-- DELETE FROM public.shop_items;

-- Insert 11 rewards for 10-year-old girl
INSERT INTO public.shop_items (name, description, price, icon, is_active) VALUES
  ('Extra tablet', '+30 minut hraní nebo YouTube navíc', 50, 'tablet', TRUE),
  ('Výběr večeře', 'Ty rozhodneš, co bude k večeři', 75, 'utensils', TRUE),
  ('Filmový večer', 'Výběr filmu + popcorn + deka na gauči', 100, 'film', TRUE),
  ('Kamarádka na návštěvu', 'Pozvání kamarádky na odpoledne', 150, 'users', TRUE),
  ('Výlet do cukrárny', 'Zmrzlina nebo zákusek dle výběru', 200, 'ice-cream-cone', TRUE),
  ('Nová kniha/komiks', 'Výběr knihy nebo komiksu v obchodě', 300, 'book-open', TRUE),
  ('Kreativní set', 'Korálky, malování, slime kit apod.', 400, 'palette', TRUE),
  ('Den bez povinností', 'Žádné úkoly, jen volný čas', 500, 'sparkles', TRUE),
  ('Výlet dle výběru', 'Zoo, aquapark, kino, laser game...', 750, 'map', TRUE),
  ('Velký dárek', 'Plyšák, hra, oblečení - dle dohody', 1000, 'gift', TRUE),
  ('Přespávačka', 'Kamarádka přespí u nás doma', 1000, 'moon', TRUE);
