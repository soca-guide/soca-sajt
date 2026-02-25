-- ══════════════════════════════════════════════════════════════════════
-- Soča Sajt — Partner Events (impressions, clicks, filters)
-- Pokreni JEDNOM u Supabase SQL Editor.
-- ══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.partner_events (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  partner_id       uuid        REFERENCES public.partners(id) ON DELETE CASCADE,
  tenant_id        uuid        NULL,
  municipality_slug text       NULL,
  settlement_slug  text        NULL,
  type             text        NULL,   -- activities | food | taxi
  category         text        NULL,
  tier             text        NULL,
  event_name       text        NOT NULL,
    -- impression | click_open | click_call | click_whatsapp | click_booking | filter_used
  filter_value     text        NULL,   -- for filter_used events
  session_id       text        NOT NULL,
  page_path        text        NULL,
  user_agent       text        NULL,
  referrer         text        NULL,
  CONSTRAINT pe_event_name_check CHECK (
    event_name IN ('impression','click_open','click_call','click_whatsapp','click_booking','filter_used')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS pe_created_at_idx     ON public.partner_events (created_at DESC);
CREATE INDEX IF NOT EXISTS pe_partner_id_idx     ON public.partner_events (partner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS pe_event_name_idx     ON public.partner_events (event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS pe_municipality_idx   ON public.partner_events (municipality_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS pe_session_idx        ON public.partner_events (session_id, page_path);

-- RLS
ALTER TABLE public.partner_events ENABLE ROW LEVEL SECURITY;

-- Anon može samo INSERT (ne čitanje, ne brisanje)
DROP POLICY IF EXISTS pe_anon_insert ON public.partner_events;
CREATE POLICY pe_anon_insert ON public.partner_events
  FOR INSERT TO anon
  WITH CHECK (
    event_name IN ('impression','click_open','click_call','click_whatsapp','click_booking','filter_used')
    AND char_length(session_id) BETWEEN 10 AND 100
  );

-- Authenticated (MASTER) može sve
DROP POLICY IF EXISTS pe_auth_all ON public.partner_events;
CREATE POLICY pe_auth_all ON public.partner_events
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grants
GRANT INSERT ON public.partner_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_events TO authenticated;

-- RPC za batch insert (bolje od direktnog INSERT za performanse)
CREATE OR REPLACE FUNCTION public.track_partner_events(events jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ev jsonb;
BEGIN
  FOR ev IN SELECT * FROM jsonb_array_elements(events) LOOP
    INSERT INTO public.partner_events (
      partner_id, tenant_id, municipality_slug, settlement_slug,
      type, category, tier, event_name, filter_value,
      session_id, page_path, user_agent, referrer
    ) VALUES (
      (ev->>'partner_id')::uuid,
      CASE WHEN ev->>'tenant_id' IS NOT NULL THEN (ev->>'tenant_id')::uuid ELSE NULL END,
      ev->>'municipality_slug',
      ev->>'settlement_slug',
      ev->>'type',
      ev->>'category',
      ev->>'tier',
      ev->>'event_name',
      ev->>'filter_value',
      ev->>'session_id',
      ev->>'page_path',
      ev->>'user_agent',
      ev->>'referrer'
    );
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_partner_events(jsonb) TO anon;

-- Auto-cleanup events starijih od 365 dana
CREATE OR REPLACE FUNCTION public.cleanup_partner_events()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.partner_events WHERE created_at <= now() - INTERVAL '365 days';
$$;
GRANT EXECUTE ON FUNCTION public.cleanup_partner_events() TO anon;

-- ══════════════════════════════════════════════════════════════════════
-- GOTOVO. Tracking je spreman.
-- ══════════════════════════════════════════════════════════════════════
