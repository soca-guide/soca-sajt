-- Legal system seed — bezbedno za ponovljeno izvrsavanje (WHERE NOT EXISTS)
-- Ubacu jednom u Supabase SQL Editor

-- 0) Osiguraj da 'ui' sekcija postoji
INSERT INTO public.sections (section_key, title_key, "order", visible_default)
VALUES ('ui', 'ui', 0, false)
ON CONFLICT (section_key) DO NOTHING;

-- 1) footer_config
INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, municipality_slugs, updated_at)
SELECT NULL, 'ui', 'footer_config', 'config', 10, true,
'{
  "copyright": {
    "sl": "© 2026 Soča Guide",
    "en": "© 2026 Soča Guide"
  },
  "links": [
    { "label": { "sl": "Impressum", "en": "Imprint" },   "url": "/legal/?doc=impressum", "enabled": true },
    { "label": { "sl": "Zasebnost", "en": "Privacy" },   "url": "/legal/?doc=privacy",   "enabled": true },
    { "label": { "sl": "Piškotki", "en": "Cookies" },    "url": "/legal/?doc=cookies",   "enabled": true },
    { "label": { "sl": "Pogoji",   "en": "Terms" },      "url": "/legal/?doc=terms",     "enabled": false }
  ]
}'::jsonb,
NULL, NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.items WHERE tenant_id IS NULL AND section_key = 'ui' AND item_key = 'footer_config'
);

-- 2) legal_impressum
INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, municipality_slugs, updated_at)
SELECT NULL, 'ui', 'legal_impressum', 'config', 20, true,
'{
  "title": {
    "sl": "Impressum",
    "en": "Imprint"
  },
  "body_html": {
    "sl": "<h2>Upravljavec spletnega mesta</h2><p><strong>Soča Guide</strong> (pilotni projekt)</p><p>Kontakt: info@SOCAGUIDE.si</p><p>Sedež: Slovenija</p><p>Projekt je trenutno v pilotni fazi in je brezplačen digitalni vodič za goste. Pravna struktura in komercialni pogoji bodo objavljeni pred uvedbo plačljivih storitev.</p>",
    "en": "<h2>Website Operator</h2><p><strong>Soča Guide</strong> (pilot project)</p><p>Contact: info@SOCAGUIDE.si</p><p>Based in: Slovenia</p><p>This project is currently in a pilot phase and operates as a free digital guest guide. Legal and commercial terms will be published before any paid services are introduced.</p>"
  }
}'::jsonb,
NULL, NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.items WHERE tenant_id IS NULL AND section_key = 'ui' AND item_key = 'legal_impressum'
);

-- 3) legal_privacy
INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, municipality_slugs, updated_at)
SELECT NULL, 'ui', 'legal_privacy', 'config', 21, true,
'{
  "title": {
    "sl": "Politika zasebnosti",
    "en": "Privacy Policy"
  },
  "body_html": {
    "sl": "<p>Spletna stran Soča Guide je informativni digitalni vodič za goste in je trenutno v pilotni fazi.</p><h2>Zbiranje podatkov</h2><p>Ne zbiramo osebnih podatkov uporabnikov. Sistem lahko beleži anonimne statistične podatke, kot so ogledi strani, kliki in osnovna uporaba aplikacije za namen izboljšave storitve.</p><h2>Analitika</h2><p>Uporabljamo anonimno analitiko (npr. Google Analytics) za merjenje obiska, klikov in uporabe funkcij. Podatki so agregirani in ne omogočajo neposredne identifikacije posameznika.</p><h2>Namen obdelave</h2><p>Podatki se uporabljajo izključno za izboljšanje uporabniške izkušnje, stabilnosti sistema in razvoja platforme.</p><h2>Hramba podatkov</h2><p>Anonimni statistični podatki se hranijo omejen čas v skladu z dobrimi praksami digitalne analitike.</p>",
    "en": "<p>Soča Guide is an informational digital guest guide currently operating in pilot mode.</p><h2>Data Collection</h2><p>We do not intentionally collect personal data. The system may record anonymous usage statistics such as page views, clicks, and feature interactions to improve the service.</p><h2>Analytics</h2><p>We use anonymous analytics (e.g. Google Analytics) to measure traffic, clicks, and feature usage. Data is aggregated and does not directly identify users.</p><h2>Purpose of Processing</h2><p>Data is used solely to improve user experience, system stability, and platform development.</p><h2>Data Retention</h2><p>Anonymous statistical data is stored for a limited time according to standard analytics practices.</p>"
  }
}'::jsonb,
NULL, NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.items WHERE tenant_id IS NULL AND section_key = 'ui' AND item_key = 'legal_privacy'
);

-- 4) legal_cookies
INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, municipality_slugs, updated_at)
SELECT NULL, 'ui', 'legal_cookies', 'config', 22, true,
'{
  "title": {
    "sl": "Piškotki",
    "en": "Cookies"
  },
  "body_html": {
    "sl": "<p>Spletna stran uporablja nujne in analitične piškotke za pravilno delovanje in izboljšanje uporabniške izkušnje.</p><h2>Nujni piškotki</h2><p>Ti piškotki omogočajo osnovne funkcije sistema, kot so jezik, navigacija in stabilnost aplikacije.</p><h2>Analitični piškotki</h2><p>Analitični piškotki se uporabljajo za anonimno merjenje obiska, klikov in uporabe funkcij znotraj digitalnega vodiča.</p><h2>Upravljanje piškotkov</h2><p>Uporabnik lahko piškotke upravlja ali onemogoči v nastavitvah svojega brskalnika.</p>",
    "en": "<p>This website uses essential and analytics cookies to ensure proper functionality and improve user experience.</p><h2>Essential Cookies</h2><p>These cookies are required for core system functions such as language selection, navigation, and application stability.</p><h2>Analytics Cookies</h2><p>Analytics cookies are used to anonymously measure visits, clicks, and feature usage within the digital guide.</p><h2>Cookie Management</h2><p>Users can manage or disable cookies through their browser settings.</p>"
  }
}'::jsonb,
NULL, NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.items WHERE tenant_id IS NULL AND section_key = 'ui' AND item_key = 'legal_cookies'
);

-- 5) legal_terms
INSERT INTO public.items (tenant_id, section_key, item_key, type, "order", visible, data_json, municipality_slugs, updated_at)
SELECT NULL, 'ui', 'legal_terms', 'config', 23, true,
'{
  "title": {
    "sl": "Pogoji uporabe",
    "en": "Terms of Use"
  },
  "body_html": {
    "sl": "<p>Soča Guide je brezplačen pilotni digitalni vodič za goste. Storitev je trenutno v testni fazi.</p><h2>Uporaba storitve</h2><p>Uporabnik uporablja spletno stran na lastno odgovornost. Vsebina je informativne narave.</p><h2>Omejitev odgovornosti</h2><p>Upravljavec ne odgovarja za morebitno škodo, netočnosti informacij ali začasno nedelovanje sistema.</p><h2>Prihodnje storitve</h2><p>Ob uvedbi plačljivih SaaS storitev bodo objavljeni dodatni poslovni pogoji, naročnine in pravila uporabe.</p>",
    "en": "<p>Soča Guide is a free pilot digital guest guide. The service is currently in a testing phase.</p><h2>Service Usage</h2><p>Users access and use the website at their own risk. All content is informational.</p><h2>Limitation of Liability</h2><p>The operator is not liable for any damages, inaccuracies, or temporary service interruptions.</p><h2>Future Services</h2><p>When paid SaaS features are introduced, additional commercial terms, subscriptions, and usage policies will be published.</p>"
  }
}'::jsonb,
NULL, NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.items WHERE tenant_id IS NULL AND section_key = 'ui' AND item_key = 'legal_terms'
);
