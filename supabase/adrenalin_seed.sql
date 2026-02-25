-- ════════════════════════════════════════════════════════════════════════════
-- Soča Sajt — Adrenalin providers seed (16 providers)
-- Run once in Supabase SQL Editor.  Safe to re-run (WHERE NOT EXISTS).
-- tenant_id IS NULL → global rows, visible to all guests.
-- data_json fields:
--   name, categories (array), website, address_text, maps_url,
--   banner_text, tier (free/featured/premium), priority, weight, active
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.sections (section_key, title_key, "order", visible_default)
VALUES ('adrenalin', 'adrenalin', 6, true)
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'adrenalin','bovec-rafting-team','adrenalin_provider',1,true,
  '{"name":"Bovec Rafting Team","categories":["rafting"],"website":"https://www.bovec-rafting-team.com/","address_text":null,"maps_url":"","banner_text":"Rafting","tier":"premium","priority":0,"weight":2,"active":true}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='adrenalin' AND item_key='bovec-rafting-team' AND tenant_id IS NULL);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'adrenalin','soca-rafting','adrenalin_provider',2,true,
  '{"name":"So\u010da Rafting","categories":["rafting"],"website":"https://www.socarafting.si/en/","address_text":null,"maps_url":"","banner_text":"Rafting","tier":"free","priority":0,"weight":1,"active":true}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='adrenalin' AND item_key='soca-rafting' AND tenant_id IS NULL);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'adrenalin','soca-adventure','adrenalin_provider',3,true,
  '{"name":"So\u010da Adventure","categories":["rafting","canyoning"],"website":"https://www.soca-adventure.com/","address_text":null,"maps_url":"","banner_text":"Rafting \u2022 Canyoning","tier":"featured","priority":0,"weight":1,"active":true}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='adrenalin' AND item_key='soca-adventure' AND tenant_id IS NULL);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'adrenalin','rock-the-boat-europe','adrenalin_provider',4,true,
  '{"name":"Rock The Boat Europe","categories":["rafting"],"website":"https://rocktheboateurope.com/","address_text":null,"maps_url":"","banner_text":"Rafting","tier":"free","priority":0,"weight":1,"active":true}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='adrenalin' AND item_key='rock-the-boat-europe' AND tenant_id IS NULL);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'adrenalin','bovecsport','adrenalin_provider',5,true,
  '{"name":"BovecSport / Alpe \u0160port","categories":["rafting","kayaking","outdoor"],"website":"https://www.bovecsport.com/en","address_text":null,"maps_url":"","banner_text":"Rafting \u2022 Kayaking","tier":"free","priority":0,"weight":1,"active":true}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='adrenalin' AND item_key='bovecsport' AND tenant_id IS NULL);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'adrenalin','kayak-soca','adrenalin_provider',6,true,
  '{"name":"Kayak So\u010da","categories":["kayaking","rafting"],"website":"https://kayak-soca.com/","address_text":null,"maps_url":"","banner_text":"Kayaking \u2022 Rafting","tier":"free","priority":0,"weight":1,"active":true}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='adrenalin' AND item_key='kayak-soca' AND tenant_id IS NULL);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'adrenalin','bovec-canyoning','adrenalin_provider',7,true,
  '{"name":"Bovec Canyoning","categories":["canyoning"],"website":"https://www.bovec-canyoning.com/","address_text":null,"maps_url":"","banner_text":"Canyoning","tier":"free","priority":0,"weight":1,"active":true}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='adrenalin' AND item_key='bovec-canyoning' AND tenant_id IS NULL);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'adrenalin','hydromania','adrenalin_provider',8,true,
  '{"name":"Hydromania","categories":["hydrospeed","rafting"],"website":"https://www.hydromania.si/en/activities/hydrospeed/","address_text":null,"maps_url":"","banner_text":"Hydrospeed \u2022 Rafting","tier":"free","priority":0,"weight":1,"active":true}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='adrenalin' AND item_key='hydromania' AND tenant_id IS NULL);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'adrenalin','dk-sport','adrenalin_provider',9,true,
  '{"name":"DK Sport","categories":["rafting","outdoor"],"website":"https://www.dksport.si/","address_text":null,"maps_url":"","banner_text":"Rafting \u2022 Outdoor","tier":"free","priority":0,"weight":1,"active":true}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='adrenalin' AND item_key='dk-sport' AND tenant_id IS NULL);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'adrenalin','alpi-center','adrenalin_provider',10,true,
  '{"name":"Alpi Center","categories":["outdoor","hiking"],"website":"https://alpicenter.eu/","address_text":null,"maps_url":"","banner_text":"Outdoor \u2022 Hiking","tier":"free","priority":0,"weight":1,"active":true}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='adrenalin' AND item_key='alpi-center' AND tenant_id IS NULL);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'adrenalin','terramystica','adrenalin_provider',11,true,
  '{"name":"Terramystica","categories":["outdoor","canyoning"],"website":"https://www.terramystica.si/","address_text":null,"maps_url":"","banner_text":"Outdoor \u2022 Canyoning","tier":"free","priority":0,"weight":1,"active":true}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='adrenalin' AND item_key='terramystica' AND tenant_id IS NULL);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'adrenalin','outdoor-galaxy','adrenalin_provider',12,true,
  '{"name":"Outdoor Galaxy","categories":["outdoor","rafting"],"website":"https://www.outdoor-galaxy.com/","address_text":null,"maps_url":"","banner_text":"Outdoor \u2022 Rafting","tier":"free","priority":0,"weight":1,"active":true}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='adrenalin' AND item_key='outdoor-galaxy' AND tenant_id IS NULL);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'adrenalin','natures-ways','adrenalin_provider',13,true,
  '{"name":"Nature''s Ways","categories":["outdoor","rafting"],"website":"https://www.econaturesways.com/","address_text":null,"maps_url":"","banner_text":"Outdoor \u2022 Rafting","tier":"free","priority":0,"weight":1,"active":true}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='adrenalin' AND item_key='natures-ways' AND tenant_id IS NULL);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'adrenalin','soca-rider','adrenalin_provider',14,true,
  '{"name":"So\u010da Rider","categories":["rafting"],"website":"https://www.raftingslovenia.com/","address_text":null,"maps_url":"","banner_text":"Rafting","tier":"free","priority":0,"weight":1,"active":true}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='adrenalin' AND item_key='soca-rider' AND tenant_id IS NULL);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'adrenalin','flying-bear-paragliding','adrenalin_provider',15,true,
  '{"name":"Flying Bear Paragliding","categories":["paragliding"],"website":"https://paragliding-bovec.com/","address_text":null,"maps_url":"","banner_text":"Paragliding","tier":"premium","priority":0,"weight":2,"active":true}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='adrenalin' AND item_key='flying-bear-paragliding' AND tenant_id IS NULL);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'adrenalin','paragliding-bovec','adrenalin_provider',16,true,
  '{"name":"Paragliding Bovec","categories":["paragliding"],"website":"https://www.paraglidingbovec.com/","address_text":null,"maps_url":"","banner_text":"Paragliding","tier":"free","priority":0,"weight":1,"active":true}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='adrenalin' AND item_key='paragliding-bovec' AND tenant_id IS NULL);
