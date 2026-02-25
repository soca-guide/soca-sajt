-- ══════════════════════════════════════════════════════════════════════
-- 1) Ažuriranje Lost & Found: 30 dana → 15 dana
-- ══════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS lfp_anon_read ON public.lost_found_posts;
CREATE POLICY lfp_anon_read ON public.lost_found_posts
  FOR SELECT TO anon
  USING (created_at > now() - INTERVAL '15 days');

CREATE OR REPLACE FUNCTION public.cleanup_lost_found_posts()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.lost_found_posts
  WHERE created_at <= now() - INTERVAL '15 days';
$$;

-- ══════════════════════════════════════════════════════════════════════
-- 2) Tabela za predloge/poboljšave gostiju
-- ══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.suggestions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  lang        text        NULL,
  role        text        NULL,
  add_text    text        NULL,
  confusing   text        NULL,
  idea        text        NULL,
  tenant_slug text        NULL,
  is_read     boolean     NOT NULL DEFAULT false,
  CONSTRAINT sugg_add_length CHECK (char_length(COALESCE(add_text,'')) <= 1000)
);

ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- Anon ne može čitati (samo MASTER vidi)
DROP POLICY IF EXISTS sugg_anon_insert ON public.suggestions;

-- Insert ide kroz SECURITY DEFINER funkciju
CREATE OR REPLACE FUNCTION public.create_suggestion(
  p_lang        text DEFAULT NULL,
  p_role        text DEFAULT NULL,
  p_add_text    text DEFAULT NULL,
  p_confusing   text DEFAULT NULL,
  p_idea        text DEFAULT NULL,
  p_tenant_slug text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id uuid;
BEGIN
  IF char_length(COALESCE(p_add_text,'') || COALESCE(p_confusing,'') || COALESCE(p_idea,'')) < 1 THEN
    RAISE EXCEPTION 'EMPTY_SUGGESTION';
  END IF;
  INSERT INTO public.suggestions (lang, role, add_text, confusing, idea, tenant_slug)
  VALUES (p_lang, p_role, p_add_text, p_confusing, p_idea, p_tenant_slug)
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('id', v_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_suggestion(text,text,text,text,text,text) TO anon;

-- MASTER (authenticated) može SELECT, UPDATE (mark read), DELETE
DROP POLICY IF EXISTS sugg_master_all ON public.suggestions;
CREATE POLICY sugg_master_all ON public.suggestions
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Auto-brisanje starijih od 90 dana
CREATE OR REPLACE FUNCTION public.cleanup_suggestions()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.suggestions WHERE created_at <= now() - INTERVAL '90 days';
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_suggestions() TO anon;
