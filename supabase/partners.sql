-- ══════════════════════════════════════════════════════════════════════
-- Soča Sajt — Partners tabela (Adrenalin / Restorani / Taxi)
-- Pokreni JEDNOM u Supabase SQL Editor.
-- ══════════════════════════════════════════════════════════════════════

-- 1) Tabela
CREATE TABLE IF NOT EXISTS public.partners (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  name              text        NOT NULL,
  type              text        NOT NULL CHECK (type IN ('activities','food','taxi')),
  category          text        NOT NULL DEFAULT 'other',
  tier              text        NOT NULL DEFAULT 'standard'
                                CHECK (tier IN ('premium','featured','standard')),
  order_index       int         NOT NULL DEFAULT 100,
  short_desc        text,
  image_url         text,
  phone             text,
  whatsapp          text,
  booking_url       text,
  municipalities    text[],
  all_municipalities boolean    NOT NULL DEFAULT false,
  all_settlements   boolean     NOT NULL DEFAULT true,
  is_active         boolean     NOT NULL DEFAULT true
);

-- Index za brze upite po type
CREATE INDEX IF NOT EXISTS partners_type_idx ON public.partners (type, is_active, tier, order_index);

-- 2) RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Anon može čitati samo aktivne partnere
DROP POLICY IF EXISTS partners_anon_read ON public.partners;
CREATE POLICY partners_anon_read ON public.partners
  FOR SELECT TO anon
  USING (is_active = true);

-- Authenticated (MASTER) može sve
DROP POLICY IF EXISTS partners_auth_all ON public.partners;
CREATE POLICY partners_auth_all ON public.partners
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3) Primer podataka — Bovec (zameni sa pravim biznisima)
-- TIP: type = 'activities' | 'food' | 'taxi'
-- TIER: 'premium' = hero kartica | 'featured' = horizontalni scroll | 'standard' = lista

-- ACTIVITIES
INSERT INTO public.partners (name, type, category, tier, order_index, short_desc, phone, booking_url, municipalities, all_municipalities)
VALUES
  ('Soča Rafting Center', 'activities', 'rafting', 'premium', 1,
   'Rafting na smaragdnoj Soči za sve uzraste. Oprema uključena.',
   '+386 41 123 456', 'https://www.soca-rafting.si', ARRAY['bovec'], false),

  ('Fly Bovec Paragliding', 'activities', 'paragliding', 'featured', 1,
   'Tandem paragliding sa pogledom na dolinu Soče.',
   '+386 41 234 567', 'https://www.flybovec.com', ARRAY['bovec'], false),

  ('Bovec Kayak School', 'activities', 'kayak', 'featured', 2,
   'Škola kajaka za početnike i napredne na Soči.',
   '+386 41 345 678', NULL, ARRAY['bovec'], false),

  ('Trek Soča', 'activities', 'hiking', 'standard', 1,
   'Vođene ture po Triglavskom nacionalnom parku.',
   '+386 41 456 789', NULL, ARRAY['bovec','kobarid'], false),

  ('Soča Canyoning', 'activities', 'canyoning', 'standard', 2,
   'Kanjoning avanture u dolini Soče.',
   '+386 41 567 890', NULL, ARRAY['bovec'], false)

ON CONFLICT DO NOTHING;

-- FOOD
INSERT INTO public.partners (name, type, category, tier, order_index, short_desc, phone, municipalities, all_municipalities)
VALUES
  ('Gostišče Sovdat', 'food', 'gostilna', 'premium', 1,
   'Porodična gostilna od 1969. Tradicionalna slovenska kuhinja, postrvi i žara.',
   '+386 5 389 6000', ARRAY['bovec'], false),

  ('Felix Café', 'food', 'cafe', 'featured', 1,
   'Kafić i slastičarnica u centru Bovca. Kafa, torte, domaći sladoled.',
   '+386 41 111 222', ARRAY['bovec'], false),

  ('Bovec Kitch''n', 'food', 'street_food', 'featured', 2,
   'Street food na trgu: grilovana pastrmka, čompe, frika.',
   '+386 41 222 333', ARRAY['bovec'], false),

  ('Restavracija Kot', 'food', 'restaurant', 'standard', 1,
   'Moderna kuhinja u srcu Bovca. Lokalni sastojci.',
   '+386 5 389 6320', ARRAY['bovec'], false),

  ('Pizzerija Guliver', 'food', 'pizzeria', 'standard', 2,
   'Pizzerija i pub s domaćom hranom po pristupačnim cenama.',
   '+386 41 333 444', ARRAY['bovec'], false)

ON CONFLICT DO NOTHING;

-- TAXI
INSERT INTO public.partners (name, type, category, tier, order_index, short_desc, phone, whatsapp, municipalities, all_municipalities)
VALUES
  ('Soča Taxi Express', 'taxi', 'taxi', 'premium', 1,
   '24/7 taxi servis u dolini Soče. Aerodrom Ljubljana, transfer na zahtev.',
   '+386 41 700 100', '+386 41 700 100', ARRAY['bovec','kobarid','tolmin'], false),

  ('Kanin Ride', 'taxi', 'transfer', 'featured', 1,
   'Privatni transferi, airport shuttle, grupni prevoz.',
   '+386 41 800 200', '+386 41 800 200', ARRAY['bovec'], false),

  ('Bovec QuickCab', 'taxi', 'taxi', 'standard', 1,
   'Brzi lokalni taxi. Dostupan 7-23h.',
   '+386 41 900 300', NULL, ARRAY['bovec'], false)

ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════
-- GOTOVO. Dalje upravljaj partnerima kroz Admin panel.
-- ══════════════════════════════════════════════════════════════════════
