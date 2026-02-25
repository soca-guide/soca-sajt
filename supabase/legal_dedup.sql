-- ─────────────────────────────────────────────────────────────────────────────
-- LEGAL DEDUP — briše duplikate u global legal items
-- Pokreni JEDNOM u Supabase SQL Editor ako legal stranice ne prikazuju sadržaj
-- Čuva NAJNOVIJI red za svaki item_key, ostale briše
-- ─────────────────────────────────────────────────────────────────────────────

DELETE FROM public.items
WHERE id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY item_key
        ORDER BY updated_at DESC, created_at DESC
      ) AS rn
    FROM public.items
    WHERE tenant_id IS NULL
      AND section_key = 'ui'
      AND item_key IN ('legal_impressum', 'legal_privacy', 'legal_cookies', 'legal_terms')
  ) ranked
  WHERE rn > 1
);

-- Provjera: treba biti max 1 red po item_key
SELECT item_key, COUNT(*) as rows
FROM public.items
WHERE tenant_id IS NULL
  AND section_key = 'ui'
  AND item_key IN ('legal_impressum', 'legal_privacy', 'legal_cookies', 'legal_terms')
GROUP BY item_key
ORDER BY item_key;
