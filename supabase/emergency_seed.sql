-- ════════════════════════════════════════════════════════════════════════════
-- Soča Sajt — Emergency services seed
-- Run once in Supabase SQL Editor.  Safe to re-run (WHERE NOT EXISTS guards).
-- tenant_id IS NULL  →  global rows visible to every guest.
-- NULL != NULL in PG unique constraints, so we use WHERE NOT EXISTS instead
-- of ON CONFLICT for all rows with tenant_id = NULL.
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Ensure 'emergency' section row exists (prevents FK violation on items insert)
INSERT INTO public.sections (section_key, title_key, "order", visible_default)
VALUES ('emergency', 'emergency', 5, true)
ON CONFLICT (section_key) DO NOTHING;

-- 2. Insert global emergency services (safe re-run via WHERE NOT EXISTS)
INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL, 'emergency', 'tourist-medical-bovec', 'emergency_service', 1, true,
  '{"name":"Tourist medical service (Bovec)","address":"Kot 85, 5230 Bovec","phone":"+386 5 620 33 22","tel":"tel:+38656203322","directions":"https://www.google.com/maps/search/?api=1&query=Kot+85%2C+5230+Bovec"}'::jsonb,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.items
  WHERE section_key = 'emergency' AND item_key = 'tourist-medical-bovec' AND tenant_id IS NULL
);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL, 'emergency', 'emergency-medical-tolmin', 'emergency_service', 2, true,
  '{"name":"Emergency medical service (Tolmin) \u2013 24 hours","address":"Pre\u0161ernova 6/a, 5220 Tolmin","phone":"+386 5 38 81 120","tel":"tel:+38653881120","directions":"https://www.google.com/maps/search/?api=1&query=Pre%C5%A1ernova+6%2Fa%2C+5220+Tolmin"}'::jsonb,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.items
  WHERE section_key = 'emergency' AND item_key = 'emergency-medical-tolmin' AND tenant_id IS NULL
);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL, 'emergency', 'dental-nova-gorica', 'emergency_service', 3, true,
  '{"name":"Health Center Dental Care Nova Gorica","address":"","phone":"+386 5 39 38 700","tel":"tel:+38653938700","directions":"https://www.google.com/maps/search/?api=1&query=Health+Center+Dental+Care+Nova+Gorica"}'::jsonb,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.items
  WHERE section_key = 'emergency' AND item_key = 'dental-nova-gorica' AND tenant_id IS NULL
);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL, 'emergency', 'pharmacy-bovec', 'emergency_service', 4, true,
  '{"name":"Pharmacy Bovec","address":"Kot 86, 5230 Bovec","phone":"+386 5 38 96 180","tel":"tel:+38653896180","directions":"https://www.google.com/maps/search/?api=1&query=Kot+86%2C+5230+Bovec"}'::jsonb,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.items
  WHERE section_key = 'emergency' AND item_key = 'pharmacy-bovec' AND tenant_id IS NULL
);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL, 'emergency', 'pharmacy-kobarid', 'emergency_service', 5, true,
  '{"name":"Pharmacy Kobarid","address":"Trg svobode 3b, 5222 Kobarid","phone":"+386 5 38 85 077","tel":"tel:+38653885077","directions":"https://www.google.com/maps/search/?api=1&query=Trg+svobode+3b%2C+5222+Kobarid"}'::jsonb,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.items
  WHERE section_key = 'emergency' AND item_key = 'pharmacy-kobarid' AND tenant_id IS NULL
);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL, 'emergency', 'pharmacy-tolmin', 'emergency_service', 6, true,
  '{"name":"Pharmacy Tolmin","address":"Trg mar\u0161ala Tita 11, 5220 Tolmin","phone":"+386 5 38 11 480","tel":"tel:+38653811480","directions":"https://www.google.com/maps/search/?api=1&query=Trg+mar%C5%A1ala+Tita+11%2C+5220+Tolmin"}'::jsonb,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.items
  WHERE section_key = 'emergency' AND item_key = 'pharmacy-tolmin' AND tenant_id IS NULL
);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL, 'emergency', 'police-bovec', 'emergency_service', 7, true,
  '{"name":"Police station in Bovec","address":"","phone":"05 389 68 50","tel":"tel:+38653896850","directions":"https://www.google.com/maps/search/?api=1&query=Police+Station+Bovec+Slovenia"}'::jsonb,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.items
  WHERE section_key = 'emergency' AND item_key = 'police-bovec' AND tenant_id IS NULL
);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL, 'emergency', 'firefighters-bovec', 'emergency_service', 8, true,
  '{"name":"Firefighters (Bovec)","address":"","phone":"05 388 60 95","tel":"tel:+38653886095","directions":"https://www.google.com/maps/search/?api=1&query=Firefighters+Bovec+Slovenia"}'::jsonb,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.items
  WHERE section_key = 'emergency' AND item_key = 'firefighters-bovec' AND tenant_id IS NULL
);
