-- ════════════════════════════════════════════════════════════════════════════
-- Soča Sajt — Restaurants seed (16 places)
-- Run once in Supabase SQL Editor. Safe to re-run (WHERE NOT EXISTS).
-- data_json: { name, type, place, address, descSl, descEn, phone }
-- type: gostilna | restavracija | brewery | hotel | kavarna | pizzerija | bar | bistro | street
-- place: bovec | kot | mala_vas | ledina | cezsoca | log_cezsoski | log_mangart | lepena
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.sections (section_key, title_key, "order", visible_default)
VALUES ('restaurants', 'restaurants', 8, true)
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'restaurants','gostisc-sovdat','restaurant',1,true,
  '{"name":"Gosti\u0161\u010de Sovdat","type":"gostilna","place":"bovec","address":"Trg golobarskih \u017ertev 24, 5230 Bovec","descSl":"Dru\u017einska gostilna od 1969. Tradicionalna slovenska kuhinja, postrvi, \u017eara in mednarodne jedi.","descEn":"Family-run inn since 1969. Traditional Slovenian cuisine, trout, grill specialties.","phone":""}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='restaurants' AND item_key='gostisc-sovdat' AND tenant_id IS NULL);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'restaurants','restavracija-kot','restaurant',2,true,
  '{"name":"Restavracija Kot","type":"restavracija","place":"bovec","address":"Trg golobarskih \u017ertev 1, 5230 Bovec","descSl":"Modernna kuhinja v osr\u010dju Bovca. Surovosti iz lokalnih virov.","descEn":"Modern cuisine in the heart of Bovec. Local ingredients, creative starters and mains.","phone":""}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='restaurants' AND item_key='restavracija-kot' AND tenant_id IS NULL);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'restaurants','felix','restaurant',3,true,
  '{"name":"Felix","type":"kavarna","place":"bovec","address":"Trg golobarskih \u017ertev 18, 5230 Bovec","descSl":"Kavarna in sladolednica v centru Bovca. Kavica, torte, doma\u010di sladoled.","descEn":"Caf\u00e9 and gelateria in the centre of Bovec. Coffee, cakes, homemade ice cream.","phone":""}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='restaurants' AND item_key='felix' AND tenant_id IS NULL);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'restaurants','pizzerija-guliver','restaurant',4,true,
  '{"name":"Pizzerija in Pub Guliver","type":"pizzerija","place":"bovec","address":"Trg golobarskih \u017ertev 15, 5230 Bovec","descSl":"Pizzerija in pub s tradicionalno doma\u010do hrano po ugodnih cenah.","descEn":"Pizzeria and pub with traditional homemade food at fair prices.","phone":""}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='restaurants' AND item_key='pizzerija-guliver' AND tenant_id IS NULL);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'restaurants','restavracija-manu','restaurant',5,true,
  '{"name":"Restavracija & Lounge Manu","type":"restavracija","place":"bovec","address":"Trg golobarskih \u017ertev 22, 5230 Bovec","descSl":"Restavracija in lounge bar v sredi\u0161\u010du Bovca.","descEn":"Restaurant and lounge bar in the centre of Bovec.","phone":""}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='restaurants' AND item_key='restavracija-manu' AND tenant_id IS NULL);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'restaurants','bovec-kitchn','restaurant',6,true,
  '{"name":"Bovec Kitch''n (Bovska kuhna)","type":"street","place":"bovec","address":"Trg golobarskih \u017ertev, 5230 Bovec","descSl":"Street food na trgu: griljana postrv, \u010dompe, frika, gobice.","descEn":"Street food on the square: grilled trout, \u010dompe, frika, mushrooms.","phone":""}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='restaurants' AND item_key='bovec-kitchn' AND tenant_id IS NULL);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'restaurants','thirsty-river','restaurant',7,true,
  '{"name":"Thirsty River Brewing","type":"brewery","place":"kot","address":"Kot 39, 5230 Bovec","descSl":"Lokalna pivovarna in tap room. Pivo lastne proizvodnje, zajtrki, prigrizki.","descEn":"Local brewery and tap room. House-brewed beer, breakfast, snacks and cocktails.","phone":""}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='restaurants' AND item_key='thirsty-river' AND tenant_id IS NULL);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'restaurants','hotel-mangart','restaurant',8,true,
  '{"name":"Hotel Mangart","type":"hotel","place":"mala_vas","address":"Mala vas 107, 5230 Bovec","descSl":"Restavracija v 4-zvezdi\u010dnem hotelu. Elegantna jedilnica z razgledom na gore.","descEn":"Restaurant in a 4-star hotel. Elegant dining room with mountain views.","phone":""}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='restaurants' AND item_key='hotel-mangart' AND tenant_id IS NULL);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'restaurants','gostilna-pod-lipco','restaurant',9,true,
  '{"name":"Gostilna pod Lipco","type":"gostilna","place":"ledina","address":"Ledina 8, 5230 Bovec","descSl":"Tradicionalna gostilna z doma\u010do hrano. Odprta 12:00\u201321:00 (zaprto ob torkih).","descEn":"Traditional inn with homemade food. Open 12:00\u201321:00 (closed Tuesdays).","phone":""}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='restaurants' AND item_key='gostilna-pod-lipco' AND tenant_id IS NULL);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'restaurants','letni-vrt','restaurant',10,true,
  '{"name":"Letni vrt","type":"gostilna","place":"cezsoca","address":"\u010cezso\u010da 42, 5230 Bovec","descSl":"Po\u010ditni\u0161ka gostilna z vrtom. Doma\u010de jedi, prijeten vrt za jed na prostem.","descEn":"Seasonal garden inn. Homemade dishes, pleasant garden for outdoor dining.","phone":""}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='restaurants' AND item_key='letni-vrt' AND tenant_id IS NULL);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'restaurants','prijon-bar','restaurant',11,true,
  '{"name":"Prijon Bar","type":"bar","place":"cezsoca","address":"\u010cezso\u010da 15, 5230 Bovec","descSl":"Bar v \u010cezso\u010di. Pija\u010de in la\u017eji prigrizki, prijetna atmosfera ob So\u010di.","descEn":"Bar in \u010cezso\u010da. Drinks and light snacks, pleasant atmosphere by the So\u010da.","phone":""}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='restaurants' AND item_key='prijon-bar' AND tenant_id IS NULL);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'restaurants','gostisc-jazbec','restaurant',12,true,
  '{"name":"Gosti\u0161\u010de Jazbec","type":"gostilna","place":"log_cezsoski","address":"Log \u010cezso\u0161ki 70, 5230 Bovec","descSl":"Avtenti\u010dna gostilna v Logu. Doma\u010da kuhinja, divina, doma\u010di pridelki.","descEn":"Authentic inn in Log. Homemade cuisine, game, local produce.","phone":""}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='restaurants' AND item_key='gostisc-jazbec' AND tenant_id IS NULL);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'restaurants','gostisc-mangrt','restaurant',13,true,
  '{"name":"Gosti\u0161\u010de Mangrt","type":"gostilna","place":"log_mangart","address":"Log pod Mangartom 57, 5230 Bovec","descSl":"Izbirna restavracija z lokalno kuhinjo, sezonsko menijo in bogato vinsko karto.","descEn":"Upscale restaurant with local cuisine, seasonal menu and impressive wine selection.","phone":""}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='restaurants' AND item_key='gostisc-mangrt' AND tenant_id IS NULL);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'restaurants','brunarica','restaurant',14,true,
  '{"name":"Brunarica Restaurant","type":"restavracija","place":"log_mangart","address":"Log pod Mangartom 31, 5230 Bovec","descSl":"Tradicionalne slovenske jedi s sezonskimi sestavinami. Britanski \u0161ef kuhar.","descEn":"Traditional Slovenian dishes with seasonal ingredients. British chef: slow-cooked meats, BBQ.","phone":""}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='restaurants' AND item_key='brunarica' AND tenant_id IS NULL);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'restaurants','pristava-lepena','restaurant',15,true,
  '{"name":"Pristava Lepena","type":"restavracija","place":"lepena","address":"Lepena 1, 5230 Bovec","descSl":"Restavracija v dolini Lepena. Evropska in slovenska kuhinja, sve\u017ea postrv iz So\u010de.","descEn":"Restaurant in Lepena valley. European and Slovenian cuisine, fresh So\u010da trout.","phone":""}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='restaurants' AND item_key='pristava-lepena' AND tenant_id IS NULL);

INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, updated_at)
SELECT NULL,'restaurants','boka-bistro','restaurant',16,true,
  '{"name":"Boka Forest Bistro","type":"bistro","place":"lepena","address":"Boka 1, 5230 Bovec","descSl":"Bistro v gozdu pri Boki. Slovenska kuhinja, burgerji, vino.","descEn":"Bistro in the forest near Boka. Slovenian cuisine, burgers, wine.","phone":""}'::jsonb,now()
WHERE NOT EXISTS(SELECT 1 FROM public.items WHERE section_key='restaurants' AND item_key='boka-bistro' AND tenant_id IS NULL);
