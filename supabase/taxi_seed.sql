-- ════════════════════════════════════════════════════════════════════════════
-- Soča Sajt — Taxi services seed (4 firms)
-- Run once in Supabase SQL Editor. Safe to re-run (WHERE NOT EXISTS).
-- tenant_id IS NULL → global rows, visible to all guests.
-- Bus routes, origin names, route URLs stay hardcoded in taxi_bus.js.
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.sections (section_key, title_key, "order", visible_default)
VALUES ('taxi', 'taxi', 7, true)
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'taxi','soca-taxi-express','taxi_service',1,true,
  '{"name":"So\u010da Taxi Express","phone":"+386 30 123 456","tel":"tel:+38630123456"}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='taxi' AND item_key='soca-taxi-express' AND tenant_id IS NULL);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'taxi','kanin-ride','taxi_service',2,true,
  '{"name":"Kanin Ride","phone":"+386 31 234 567","tel":"tel:+38631234567"}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='taxi' AND item_key='kanin-ride' AND tenant_id IS NULL);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'taxi','bovec-quickcab','taxi_service',3,true,
  '{"name":"Bovec QuickCab","phone":"+386 40 345 678","tel":"tel:+38640345678"}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='taxi' AND item_key='bovec-quickcab' AND tenant_id IS NULL);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'taxi','emerald-valley-taxi','taxi_service',4,true,
  '{"name":"Emerald Valley Taxi","phone":"+386 51 567 890","tel":"tel:+38651567890"}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='taxi' AND item_key='emerald-valley-taxi' AND tenant_id IS NULL);
