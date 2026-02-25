-- Daily Essentials seed
-- Dodaje sekciju 'daily_essentials' u sections i 5 linkova za Bovec u items.
-- Bezbedno za ponovljeno izvrsavanje (WHERE NOT EXISTS).

-- 1) Sekcija
INSERT INTO public.sections (section_key, label, icon, display_order)
SELECT 'daily_essentials', 'Daily Essentials', '🛒', 25
WHERE NOT EXISTS (
  SELECT 1 FROM public.sections WHERE section_key = 'daily_essentials'
);

-- 2) Linkovi za Bovec (tenant_id IS NULL = globalni, municipality_slugs = {bovec})
INSERT INTO public.items
  (section_key, item_key, tenant_id, data_json, municipality_slugs, visible, "order")
SELECT 'daily_essentials', 'supermarket_0', NULL,
  '{"label_key":"quick_help_supermarket","url":"https://www.google.com/maps/search/?api=1&query=supermarket+Bovec+Slovenia"}'::jsonb,
  '{bovec}', true, 0
WHERE NOT EXISTS (
  SELECT 1 FROM public.items
  WHERE section_key = 'daily_essentials' AND item_key = 'supermarket_0' AND tenant_id IS NULL
);

INSERT INTO public.items
  (section_key, item_key, tenant_id, data_json, municipality_slugs, visible, "order")
SELECT 'daily_essentials', 'atm_1', NULL,
  '{"label_key":"quick_help_atm","url":"https://www.google.com/maps/search/?api=1&query=ATM+bankomat+Bovec+Slovenia"}'::jsonb,
  '{bovec}', true, 1
WHERE NOT EXISTS (
  SELECT 1 FROM public.items
  WHERE section_key = 'daily_essentials' AND item_key = 'atm_1' AND tenant_id IS NULL
);

INSERT INTO public.items
  (section_key, item_key, tenant_id, data_json, municipality_slugs, visible, "order")
SELECT 'daily_essentials', 'gas_2', NULL,
  '{"label_key":"quick_help_gas","url":"https://www.google.com/maps/search/?api=1&query=gas+station+Bovec+Slovenia"}'::jsonb,
  '{bovec}', true, 2
WHERE NOT EXISTS (
  SELECT 1 FROM public.items
  WHERE section_key = 'daily_essentials' AND item_key = 'gas_2' AND tenant_id IS NULL
);

INSERT INTO public.items
  (section_key, item_key, tenant_id, data_json, municipality_slugs, visible, "order")
SELECT 'daily_essentials', 'parking_3', NULL,
  '{"label_key":"quick_help_parking","url":"https://www.google.com/maps/search/?api=1&query=parking+Bovec+Slovenia"}'::jsonb,
  '{bovec}', true, 3
WHERE NOT EXISTS (
  SELECT 1 FROM public.items
  WHERE section_key = 'daily_essentials' AND item_key = 'parking_3' AND tenant_id IS NULL
);

INSERT INTO public.items
  (section_key, item_key, tenant_id, data_json, municipality_slugs, visible, "order")
SELECT 'daily_essentials', 'toilet_4', NULL,
  '{"label_key":"quick_help_toilet","url":"https://www.google.com/maps/search/?api=1&query=public+toilet+Bovec+Slovenia"}'::jsonb,
  '{bovec}', true, 4
WHERE NOT EXISTS (
  SELECT 1 FROM public.items
  WHERE section_key = 'daily_essentials' AND item_key = 'toilet_4' AND tenant_id IS NULL
);
