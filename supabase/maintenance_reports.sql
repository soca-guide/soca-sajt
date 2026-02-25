-- ══════════════════════════════════════════════════════════════════════
-- Soča Sajt — Maintenance Reports (Prijava okvar)
-- Run once in Supabase SQL Editor. Safe to re-run.
-- ══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.maintenance_reports (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  tenant_slug text        NOT NULL,
  category    text        NOT NULL,
  location    text        NULL,
  description text        NULL,
  is_read     boolean     NOT NULL DEFAULT false,
  CONSTRAINT  mr_desc_len CHECK (char_length(COALESCE(description,'')) <= 1000)
);

ALTER TABLE public.maintenance_reports ENABLE ROW LEVEL SECURITY;

-- Only authenticated (OWNER / MASTER) can read and delete
DROP POLICY IF EXISTS mr_auth_all ON public.maintenance_reports;
CREATE POLICY mr_auth_all ON public.maintenance_reports
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Anon cannot directly insert — goes via SECURITY DEFINER RPC
CREATE OR REPLACE FUNCTION public.create_maintenance_report(
  p_tenant_slug text,
  p_category    text,
  p_location    text DEFAULT NULL,
  p_description text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_tenant_slug IS NULL OR length(trim(p_tenant_slug)) = 0 THEN
    RAISE EXCEPTION 'NO_TENANT';
  END IF;
  IF p_category IS NULL OR length(trim(p_category)) = 0 THEN
    RAISE EXCEPTION 'NO_CATEGORY';
  END IF;
  INSERT INTO public.maintenance_reports (tenant_slug, category, location, description)
  VALUES (trim(p_tenant_slug), trim(p_category), p_location, p_description)
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('id', v_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_maintenance_report(text,text,text,text) TO anon;

-- Auto-cleanup: delete reports older than 90 days
CREATE OR REPLACE FUNCTION public.cleanup_maintenance_reports()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.maintenance_reports WHERE created_at <= now() - INTERVAL '90 days';
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_maintenance_reports() TO anon;
