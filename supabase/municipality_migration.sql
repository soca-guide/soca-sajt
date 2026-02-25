-- ════════════════════════════════════════════════════════════════════════════
-- Soča Sajt — Municipality migration
-- Run ONCE in Supabase SQL Editor.
--
-- What this does:
--   1. Adds municipality_slug to tenants     (which municipality the apartment belongs to)
--   2. Adds municipality_slugs[] to items    (which municipalities see this item)
--   3. Tags all existing global items as 'bovec'
--   4. Replaces get_guest_items_by_slug RPC  (filters by municipality)
-- ════════════════════════════════════════════════════════════════════════════


-- ── 1. tenants: add municipality_slug ────────────────────────────────────────
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS municipality_slug text NOT NULL DEFAULT 'bovec';


-- ── 2. items: add municipality_slugs (text array, NULL = show everywhere) ────
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS municipality_slugs text[];


-- ── 3. Tag all existing GLOBAL items as 'bovec' ──────────────────────────────
-- Global items are rows with tenant_id IS NULL.
-- tenant-specific rows (tenant_id IS NOT NULL) stay NULL → always shown to their tenant.
UPDATE public.items
   SET municipality_slugs = '{bovec}'
 WHERE tenant_id IS NULL
   AND municipality_slugs IS NULL;


-- ── 4. Replace RPC get_guest_items_by_slug (municipality-aware) ──────────────
CREATE OR REPLACE FUNCTION public.get_guest_items_by_slug(p_slug text)
RETURNS TABLE (
  tenant_id        uuid,
  section_key      text,
  item_key         text,
  "order"          integer,
  visible          boolean,
  data_json        jsonb
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    i.tenant_id,
    i.section_key,
    i.item_key,
    i."order",
    i.visible,
    i.data_json
  FROM public.tenants t
  JOIN public.items i ON (
    -- tenant-specific item for this exact tenant
    i.tenant_id = t.tenant_id
    OR (
      -- global item: visible, and either shown everywhere (NULL) or matches tenant's municipality
      i.tenant_id IS NULL
      AND i.visible = true
      AND (
        i.municipality_slugs IS NULL
        OR t.municipality_slug = ANY(i.municipality_slugs)
      )
    )
  )
  WHERE t.slug     = p_slug
    AND t.status   = 'active'
    AND i.visible  = true
  ORDER BY i."order" ASC;
$$;
