-- ════════════════════════════════════════════════════════════════════════════
-- Soča Sajt — Analytics: page views + card clicks
-- Run once in Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- Safe to re-run — uses IF NOT EXISTS / DROP IF EXISTS guards.
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Create table ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.analytics (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  event_type  text        NOT NULL,   -- 'page_view' | 'card_click'
  tenant_slug text,                   -- ?t= query-param slug (nullable for direct visits)
  card_id     text,                   -- menu card identifier (card_click events only)
  user_agent  text                    -- optional browser UA for de-duplication hints
);

-- 2. Enable RLS ────────────────────────────────────────────────────────────
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- 3. Policies ──────────────────────────────────────────────────────────────

-- Anon guests can INSERT only valid events (prevents flooding junk data)
DROP POLICY IF EXISTS analytics_anon_insert ON public.analytics;
CREATE POLICY analytics_anon_insert ON public.analytics
  FOR INSERT TO anon
  WITH CHECK (
    event_type IN ('page_view', 'card_click')
    AND (tenant_slug IS NULL OR char_length(tenant_slug) < 100)
    AND (card_id     IS NULL OR char_length(card_id)     < 50)
  );

-- Only MASTER role can read (uses the existing get_my_role() helper)
DROP POLICY IF EXISTS analytics_master_read ON public.analytics;
CREATE POLICY analytics_master_read ON public.analytics
  FOR SELECT TO authenticated
  USING (public.get_my_role() = 'MASTER');

-- 4. Grants ────────────────────────────────────────────────────────────────
GRANT INSERT ON public.analytics TO anon;
GRANT SELECT ON public.analytics TO authenticated;

-- 5. Indexes for fast GROUP BY aggregation ─────────────────────────────────
CREATE INDEX IF NOT EXISTS analytics_tenant_slug_idx
  ON public.analytics (tenant_slug, created_at);
CREATE INDEX IF NOT EXISTS analytics_event_type_idx
  ON public.analytics (event_type, created_at);
CREATE INDEX IF NOT EXISTS analytics_card_id_idx
  ON public.analytics (card_id, created_at);

-- ════════════════════════════════════════════════════════════════════════════
-- OPTIONAL: Update get_guest_items_by_slug RPC to also expose home_cards
-- (needed so the guest site can read card ordering without anon SELECT on items)
-- Only run this block if you have already created the function in a prior session.
-- ════════════════════════════════════════════════════════════════════════════
/*
CREATE OR REPLACE FUNCTION public.get_guest_items_by_slug(p_slug text)
RETURNS TABLE (
  section_key text,
  item_key    text,
  data_json   jsonb,
  tenant_id   uuid
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT section_key, item_key, data_json, tenant_id
  FROM public.items
  WHERE (
    -- global UI config (home_cards, etc.)
    (tenant_id IS NULL AND section_key = 'ui' AND item_key = 'home_cards')
    OR
    -- tenant-specific allowed items
    (
      tenant_id = (SELECT t.tenant_id FROM public.tenants t WHERE t.slug = p_slug LIMIT 1)
      AND (section_key, item_key) IN (
        ('info',    'default_config'),
        ('parking', 'parking_recommended'),
        ('house_rules', 'house_rules_private'),
        ('booking', 'rebook')
      )
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_guest_items_by_slug(text) TO anon;
*/
