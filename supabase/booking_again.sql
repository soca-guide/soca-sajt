-- =============================================================================
-- booking_again_requests — tabela + RPC
-- Idempotent. Pokrenuti jednom u Supabase SQL Editoru.
--
-- Šta ovo radi:
--   1. Kreira booking_again_requests tabelu
--   2. Kreira create_booking_again_request() RPC (SECURITY DEFINER)
--      – callable by anon (gosti bez prijave)
--      – pronalazi tenant_id po slug-u, rate-limitira na 3/email/tenant/24h
--      – inseruje red → webhook okida → send-email šalje email turistu
--
-- Nakon pokretanja ovog SQL-a, u Supabase Dashboard → Database → Webhooks:
--   Napraviti novi webhook:
--     Name:    booking-again-email
--     Table:   public.booking_again_requests
--     Events:  INSERT
--     URL:     https://hkztanenhxoducivluor.supabase.co/functions/v1/send-email
--     Headers: x-webhook-secret: <ista vrednost kao WEBHOOK_SECRET secret>
-- =============================================================================

-- 1) Tabela
CREATE TABLE IF NOT EXISTS public.booking_again_requests (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  tenant_id     uuid        NULL REFERENCES public.tenants(tenant_id) ON DELETE SET NULL,
  tenant_slug   text        NOT NULL,
  tourist_email text        NOT NULL,
  lang          text        NOT NULL DEFAULT 'en',
  status        text        NOT NULL DEFAULT 'pending', -- pending | sent | error
  error_message text        NULL
);

CREATE INDEX IF NOT EXISTS bar_tenant_idx     ON public.booking_again_requests (tenant_id);
CREATE INDEX IF NOT EXISTS bar_created_at_idx ON public.booking_again_requests (created_at DESC);

-- 2) RLS
ALTER TABLE public.booking_again_requests ENABLE ROW LEVEL SECURITY;

-- Anon ne može čitati — samo insertovati kroz SECURITY DEFINER RPC
-- MASTER može sve
DROP POLICY IF EXISTS bar_master_all ON public.booking_again_requests;
CREATE POLICY bar_master_all
  ON public.booking_again_requests FOR ALL TO authenticated
  USING      (public.get_my_role() = 'MASTER')
  WITH CHECK (public.get_my_role() = 'MASTER');

-- Grantovi (service role bypass-uje RLS automatski)
GRANT SELECT ON public.booking_again_requests TO authenticated;

-- 3) RPC — jedina putanja za insert (anon)
CREATE OR REPLACE FUNCTION public.create_booking_again_request(
  p_tenant_slug   text,
  p_tourist_email text,
  p_lang          text DEFAULT 'en'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id   uuid;
  v_email       text  := lower(trim(p_tourist_email));
  v_slug        text  := lower(trim(p_tenant_slug));
  v_req_id      uuid;
BEGIN
  -- Validacija emaila
  IF v_email IS NULL OR position('@' IN v_email) = 0 OR char_length(v_email) > 200 THEN
    RAISE EXCEPTION 'INVALID_EMAIL';
  END IF;

  -- Validacija slug-a
  IF v_slug IS NULL OR char_length(v_slug) < 1 THEN
    RAISE EXCEPTION 'INVALID_SLUG';
  END IF;

  -- Pronađi tenant
  SELECT tenant_id INTO v_tenant_id
  FROM public.tenants
  WHERE slug = v_slug AND status = 'active'
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_NOT_FOUND';
  END IF;

  -- Rate limit: max 3 zahteva po email+tenant na 24h
  IF (
    SELECT count(*)
    FROM public.booking_again_requests
    WHERE tourist_email = v_email
      AND tenant_id     = v_tenant_id
      AND created_at    > now() - INTERVAL '24 hours'
  ) >= 3 THEN
    RAISE EXCEPTION 'RATE_LIMIT';
  END IF;

  INSERT INTO public.booking_again_requests (tenant_id, tenant_slug, tourist_email, lang)
  VALUES (v_tenant_id, v_slug, v_email, COALESCE(NULLIF(TRIM(p_lang), ''), 'en'))
  RETURNING id INTO v_req_id;

  RETURN v_req_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_booking_again_request(text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.create_booking_again_request(text, text, text) TO authenticated;
