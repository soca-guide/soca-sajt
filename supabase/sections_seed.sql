-- ════════════════════════════════════════════════════════════════════════════
-- Soča Sajt — Sections seed
-- Run once in Supabase SQL Editor. Safe to re-run (ON CONFLICT DO NOTHING).
-- Populates all section_key values that items table references via FK.
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.sections (section_key, title_key, "order", visible_default) VALUES
  ('ui',          'ui',          0, true),
  ('house_rules', 'rules',       1, true),
  ('parking',     'parking',     2, true),
  ('info',        'info',        3, true),
  ('booking',     'booking',     4, true)
ON CONFLICT (section_key) DO NOTHING;
