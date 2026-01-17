-- =====================================================
-- ČASOVÁ KAPSLE - Motivation 3.0
-- Dítě píše dopis sobě do budoucnosti
-- =====================================================

-- Tabulka pro časové kapsle
CREATE TABLE IF NOT EXISTS public.time_capsules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Obsah kapsle
  message TEXT NOT NULL,                    -- Hlavní zpráva/dopis
  goals TEXT,                               -- Co chci dosáhnout?
  fears TEXT,                               -- Čeho se bojím?
  excitement TEXT,                          -- Na co se těším?

  -- Časování
  created_at TIMESTAMPTZ DEFAULT NOW(),
  unlock_date DATE NOT NULL,                -- Kdy se odemkne
  unlocked_at TIMESTAMPTZ,                  -- Kdy byla skutečně otevřena

  -- Stav
  is_locked BOOLEAN DEFAULT true,           -- Zamčená?

  -- Reakce po otevření
  reflection TEXT,                          -- Co si myslím teď?

  UNIQUE(user_id)                           -- Každé dítě má jen jednu kapsli
);

-- RLS políčky
ALTER TABLE public.time_capsules ENABLE ROW LEVEL SECURITY;

-- Uživatel vidí jen svou kapsli
CREATE POLICY "Users can view own capsule"
  ON public.time_capsules FOR SELECT
  USING (auth.uid() = user_id);

-- Uživatel může vytvořit svou kapsli
CREATE POLICY "Users can create own capsule"
  ON public.time_capsules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Uživatel může upravit svou kapsli (pro reflection po otevření)
CREATE POLICY "Users can update own capsule"
  ON public.time_capsules FOR UPDATE
  USING (auth.uid() = user_id);

-- Rodič může vidět kapsli svého dítěte (po odemčení)
CREATE POLICY "Parents can view child capsule when unlocked"
  ON public.time_capsules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = time_capsules.user_id
      AND profiles.parent_id = auth.uid()
    )
    AND is_locked = false
  );

-- Index pro rychlé vyhledávání
CREATE INDEX idx_time_capsules_user_id ON public.time_capsules(user_id);
CREATE INDEX idx_time_capsules_unlock_date ON public.time_capsules(unlock_date);
