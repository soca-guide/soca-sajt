-- ══════════════════════════════════════════════════════════════════════
-- Soča Sajt — Partners: logo_url + website_url polja
-- Pokreni JEDNOM u Supabase SQL Editor.
-- ══════════════════════════════════════════════════════════════════════

-- 1) Nova polja u partners tabeli
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS logo_url    text,   -- kvadratni logo (200×200px)
  ADD COLUMN IF NOT EXISTS website_url text;   -- website (odvojeno od booking_url)

-- ══════════════════════════════════════════════════════════════════════
-- 2) Supabase Storage bucket za slike partnera
--    VAŽNO: bucket se ne može kreirati SQL-om.
--    Uradi ručno u Supabase Dashboard:
--
--    Storage → New bucket
--    Name:    partner-images
--    Public:  YES (uključi "Public bucket")
--    → Create bucket
--
--    Zatim dodaj RLS politiku za bucket:
--    Storage → partner-images → Policies → New policy
--    Allowed operations: INSERT, SELECT
--    Role: authenticated (INSERT), public (SELECT)
--    → Save
-- ══════════════════════════════════════════════════════════════════════

-- 3) Storage RLS policies (ako koristiš SQL pristup za Storage RLS)
-- Ove politike idu u storage schema, ne public!

-- Dozvoli svima da čitaju (slike su javne)
DROP POLICY IF EXISTS "partner-images public read" ON storage.objects;
CREATE POLICY "partner-images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'partner-images');

-- Samo authenticated (MASTER) može uploadovati
DROP POLICY IF EXISTS "partner-images auth upload" ON storage.objects;
CREATE POLICY "partner-images auth upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'partner-images');

-- Samo authenticated može brisati/zamenjivati
DROP POLICY IF EXISTS "partner-images auth delete" ON storage.objects;
CREATE POLICY "partner-images auth delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'partner-images');

-- ══════════════════════════════════════════════════════════════════════
-- GOTOVO. Dalje konfigurišeš bucket u Dashboard-u (gore navedeno).
-- ══════════════════════════════════════════════════════════════════════
