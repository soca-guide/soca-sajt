(function() {
  'use strict';

  // Safety net: always force main after delay so splash never stays stuck (even if config/i18n fail to load)
  function forceEnterMainNow() {
    var wo = document.getElementById('welcome-overlay');
    var ac = document.getElementById('app-container');
    if (wo) { wo.style.display = 'none'; wo.classList.add('hide'); }
    if (ac) { ac.classList.add('show'); }
    try { sessionStorage.setItem('welcomeShown', 'true'); } catch (e) {}
  }
  setTimeout(forceEnterMainNow, 400);
  setTimeout(forceEnterMainNow, 1200);

  var defaultConfig = window.APP && window.APP.defaultConfig;
  var translations = window.APP && window.APP.translations;
  var utils = window.APP && window.APP.utils;
  var CL = window.ContentLoader || null;

  // ?debug=1 enables verbose tenant + loader logs without editing any file
  window.__DEBUG = (new URLSearchParams(window.location.search).get('debug') === '1');
  if (!defaultConfig || !translations) {
    console.error('APP defaultConfig or translations not loaded. Load config.js and i18n.js first.');
    return;
  }
  if (!utils) {
    console.error('APP.utils not loaded. Load utils.js first.');
    return;
  }
    let currentLang = 'sl';
    let activePanel = null;
    let langChangeTime = null;
    let langChangeTimer = null;

    // Load saved language preference (normalize so "SL"/" sl " etc. work)
    const savedLang = (localStorage.getItem('preferredLanguage') || '').trim().toLowerCase();
    if (savedLang && translations[savedLang]) {
      currentLang = savedLang;
    }

    // Force transition from splash to main (hide welcome overlay, show app container)
    function forceEnterMain() {
      var welcomeOverlay = document.getElementById('welcome-overlay');
      var appContainer = document.getElementById('app-container');
      if (welcomeOverlay) {
        welcomeOverlay.classList.add('hide');
        welcomeOverlay.style.display = 'none';
      }
      if (appContainer) {
        appContainer.classList.add('show');
      }
      try { sessionStorage.setItem('welcomeShown', 'true'); } catch (e) {}
    }

    // Welcome overlay logic - auto-hide after 3 seconds (or immediately if already shown)
    function initWelcomeScreen() {
      var welcomeOverlay = document.getElementById('welcome-overlay');
      var appContainer = document.getElementById('app-container');
      if (!welcomeOverlay || !appContainer) {
        setTimeout(initWelcomeScreen, 100);
        return;
      }
      var WELCOME_DISPLAY_TIME = 3000;
      if (!sessionStorage.getItem('welcomeShown')) {
        setTimeout(function() {
          forceEnterMain();
        }, WELCOME_DISPLAY_TIME);
      } else {
        forceEnterMain();
      }
    }

    var bootDone = false;
    function bootstrap() {
      if (bootDone) return;
      bootDone = true;
      if (sessionStorage.getItem('welcomeShown')) {
        forceEnterMain();
        initWelcomeScreen();
        return;
      }
      console.log('[BOOT] started');
      initWelcomeScreen();
      forceEnterMain();
      console.log('[BOOT] forcing main');
      console.log('[BOOT] done');
      setTimeout(function() {
        var welcomeOverlay = document.getElementById('welcome-overlay');
        var appContainer = document.getElementById('app-container');
        var splashVisible = welcomeOverlay && welcomeOverlay.style.display !== 'none' && !welcomeOverlay.classList.contains('hide');
        var mainHidden = appContainer && !appContainer.classList.contains('show');
        if (splashVisible || mainHidden) {
          console.log('[BOOT] fail-safe: forcing main');
          forceEnterMain();
        }
      }, 800);
    }

    var clockStarted = false;
    function startHeaderClock() {
      if (clockStarted) return;
      var timeEl = document.getElementById('weather-time');
      var dateEl = document.getElementById('weather-date');
      if (!timeEl || !dateEl) return;
      clockStarted = true;
      var lang = (localStorage.getItem('preferredLanguage') || 'sl').trim().toLowerCase();
      if (!['sl','en','de','it','pl','cs'].includes(lang)) lang = 'sl';
      function tick() {
        var d = new Date();
        timeEl.textContent = d.toLocaleTimeString(lang + '-SI', { hour: '2-digit', minute: '2-digit', hour12: false });
        dateEl.textContent = d.toLocaleDateString(lang + '-SI', { weekday: 'short', day: 'numeric', month: 'short' });
      }
      tick();
      setInterval(tick, 1000);
    }
    function injectWeatherWidgetStacking() {
      var style = document.getElementById('runtime-fixes');
      if (style) return;
      style = document.createElement('style');
      style.id = 'runtime-fixes';
      style.textContent = '.header-content{position:relative;z-index:50;}#weather-widget{position:relative;z-index:60;}#header-weather-scene,#header-moon{z-index:10;pointer-events:none;}@media(max-width:600px){#header-moon,#header-weather-scene{opacity:0.3;transform:scale(0.7);}#header-moon{top:2%;right:2%;}#weather-widget{z-index:70;}';
      document.head.appendChild(style);
    }
    document.addEventListener('DOMContentLoaded', function() {
      bootstrap();
      startHeaderClock();
      injectWeatherWidgetStacking();
      loadParkingFromFolder();
      // Pre-fetch global DB data (~300 ms so supabaseClient is ready)
      setTimeout(loadGlobalSiteName,       200);
      setTimeout(loadCardLabelOverrides,   250);
      setTimeout(loadEmergencyFromDb,       300);
      setTimeout(loadAdrenalinFromDb,       400);
      setTimeout(loadTaxiFromDb,            500);
      setTimeout(loadDailyEssentialsFromDb, 600);
    }, { once: true });
    if (document.readyState !== 'loading') {
      setTimeout(function() { bootstrap(); startHeaderClock(); injectWeatherWidgetStacking(); }, 0);
    } else {
      setTimeout(function() { bootstrap(); startHeaderClock(); injectWeatherWidgetStacking(); }, 100);
    }

    // Optional tenant override — non-blocking, only fires when ?t=<slug> is present
    (function () {
      var _slug = window.TenantLoader && typeof window.TenantLoader.getTenantSlug === 'function'
        ? window.TenantLoader.getTenantSlug() : null;
      if (_slug && typeof window.TenantLoader.loadOverrides === 'function') {
        // Apply quick actions with defaults immediately (sync, before Supabase resolves)
        applyQuickActions(null, _slug);
        window.TenantLoader.loadOverrides(_slug).then(function (ov) {
          if (window.__DEBUG) console.log('[TENANT]', ov && (ov.__health || ov));
          if (ov && ov.__health && ov.__health.ok) applyTenantOverrides(ov);
        }).catch(function () {});
      }
    })();

    // Bovec providers (defined before updateLanguage to avoid TDZ)
    function providerMapsUrl(p) {
      if (p.maps_url) return p.maps_url;
      return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent((p.name || '') + ' Bovec');
    }
    const BOVEC_PROVIDERS = ((CL && CL.getDataset('bovecProviders')) || []).map(function(p) { p.maps_url = p.maps_url || providerMapsUrl(p); return p; });

    // Cache for providers fetched from Supabase (null = not yet loaded)
    var _adrenalinDbCache = null;

    function loadAdrenalinFromDb() {
      if (_adrenalinDbCache !== null) return; // already fetched
      if (!window.supabaseClient || typeof window.supabaseClient.from !== 'function') return;
      var _munA = window._appMunicipality || 'bovec';
      window.supabaseClient
        .from('items')
        .select('item_key, "order", data_json')
        .eq('section_key', 'adrenalin')
        .is('tenant_id', null)
        .eq('visible', true)
        .or('municipality_slugs.is.null,municipality_slugs.cs.{' + _munA + '}')
        .order('order', { ascending: true })
        .then(function (r) {
          if (r.error || !r.data || !r.data.length) return; // keep hardcoded fallback
          _adrenalinDbCache = r.data.map(function (row) {
            var dj = row.data_json || {};
            var p = {
              id:           row.item_key,
              name:         dj.name         || '',
              categories:   dj.categories   || [],
              website:      dj.website       || '',
              address_text: dj.address_text  || null,
              maps_url:     dj.maps_url      || '',
              banner_text:  dj.banner_text   || '',
              tier:         dj.tier          || 'free',
              priority:     dj.priority      || 0,
              weight:       dj.weight        || 1,
              active:       dj.active        !== false,
              municipality: dj.municipality  || 'Bovec',
              settlement:   null
            };
            p.maps_url = p.maps_url || providerMapsUrl(p);
            return p;
          });
          // Refresh open screens if visible
          var adrenalinScreen = document.getElementById('adrenalin-screen');
          if (adrenalinScreen && adrenalinScreen.classList.contains('show')) renderAdrenalinContent();
          var bpc = document.getElementById('bovec-providers-content');
          if (bpc) renderProvidersSection();
        })
        .catch(function () {}); // silent — hardcoded fallback remains
    }
    function getDateSeedKey() {
      var d = new Date();
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
    function seededRandom(seed) {
      var h = 0;
      var s = String(seed);
      for (var i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
      return function() {
        h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
        h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
      };
    }
    function weightedShuffle(list, seed) {
      var rnd = seededRandom(seed);
      var expanded = [];
      list.forEach(function(p) {
        var w = Math.max(1, p.weight || 1);
        for (var i = 0; i < w; i++) expanded.push(p);
      });
      for (var i = expanded.length - 1; i > 0; i--) {
        var j = Math.floor(rnd() * (i + 1));
        var t = expanded[i]; expanded[i] = expanded[j]; expanded[j] = t;
      }
      var seen = {};
      return expanded.filter(function(p) { var k = p.id; if (seen[k]) return false; seen[k] = true; return true; });
    }
    var tierOrder = { premium: 3, featured: 2, free: 1 };
    function sortProviders(providers) {
      return providers.slice().sort(function(a, b) {
        var ta = tierOrder[a.tier] || 0, tb = tierOrder[b.tier] || 0;
        if (tb !== ta) return tb - ta;
        if ((b.priority || 0) !== (a.priority || 0)) return (b.priority || 0) - (a.priority || 0);
        return 0;
      });
    }
    var FEATURED_TOP_N = 8;
    function getFeaturedProviders(providers) {
      var paid = providers.filter(function(p) { return p.active && p.website && (p.tier === 'premium' || p.tier === 'featured'); });
      if (paid.length === 0) return [];
      var sorted = sortProviders(paid);
      var rotated = weightedShuffle(sorted, getDateSeedKey());
      return rotated.slice(0, FEATURED_TOP_N);
    }
    function getAllProvidersOrdered(providers) {
      var list = providers.filter(function(p) { return p.active && p.website; });
      var sorted = sortProviders(list);
      var seed = getDateSeedKey();
      var byTier = { premium: [], featured: [], free: [] };
      sorted.forEach(function(p) {
        var t = p.tier || 'free';
        if (!byTier[t]) byTier[t] = [];
        byTier[t].push(p);
      });
      var out = [];
      ['premium','featured','free'].forEach(function(t) {
        var arr = byTier[t] || [];
        if (arr.length) out = out.concat(weightedShuffle(arr, seed + t));
      });
      return out;
    }
    function renderProviderMiniBanner(p) {
      var trans = translations[currentLang] || translations.sl;
      var btnSite = (trans && trans.btn_site) ? trans.btn_site : 'Sajt';
      var btnLocation = (trans && trans.btn_location) ? trans.btn_location : 'Lokacija';
      var name = (p.name || '').trim();
      var tags = (p.banner_text || '').trim();
      var website = (p.website || '').trim();
      var mapsUrl = providerMapsUrl(p);
      var escapedName = name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
      var escapedTags = tags.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
      return '<div class="provider-mini-banner">' +
        '<div class="provider-mini-main">' +
          '<span class="provider-mini-name" title="' + escapedName + '">' + escapedName + '</span>' +
          (escapedTags ? '<span class="provider-mini-tags">' + escapedTags + '</span>' : '') +
        '</div>' +
        '<div class="provider-mini-actions">' +
          '<a href="' + website + '" target="_blank" rel="noopener noreferrer" class="provider-mini-btn">' + btnSite + '</a>' +
          '<a href="' + mapsUrl + '" target="_blank" rel="noopener noreferrer" class="provider-mini-btn">' + btnLocation + '</a>' +
        '</div>' +
      '</div>';
    }
    function renderProvidersSection() {
      const container = document.getElementById('bovec-providers-content');
      if (!container) return;
      var trans = translations[currentLang] || translations.sl;
      var _providers = (_adrenalinDbCache && _adrenalinDbCache.length) ? _adrenalinDbCache : BOVEC_PROVIDERS;
      var featured = getFeaturedProviders(_providers);
      var allOrdered = getAllProvidersOrdered(_providers);
      var featuredHtml = featured.length >= 1 ? ('<h4 class="providers-subtitle">' + (trans.activity_highlighted || 'Istaknuti') + '</h4><div class="providers-featured">' + featured.map(renderProviderMiniBanner).join('') + '</div>') : '';
      var allHtml = '<h4 class="providers-subtitle">' + (trans.activity_all_providers || 'Svi provajderi') + '</h4><div class="providers-all">' + allOrdered.map(renderProviderMiniBanner).join('') + '</div>';
      container.innerHTML = '<div class="providers-section">' + '<h3 class="providers-section-title">' + (trans.activity_bovec_title || 'Aktivnosti – Občina Bovec') + '</h3>' + featuredHtml + allHtml + '</div>';
    }

    // Language switching with 10 second timer
    function updateLanguage(lang) {
      // Normalize and validate: ensure we always have a valid translations key
      lang = (lang && String(lang).trim().toLowerCase()) || currentLang || 'sl';
      if (!translations[lang]) {
        lang = 'sl';
      }
      currentLang = lang;
      const trans = translations[lang];
      
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const val = trans[key];
        if (val != null && val !== '') {
          el.textContent = val;
        }
      });
      
      // Handle data-i18n-placeholder attributes
      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const val = trans[key];
        if (val != null && val !== '') {
          el.placeholder = val;
        }
      });
      
      // Welcome text stays static in English - don't update it
      const appSubtitle = document.getElementById('app-subtitle');
      if (appSubtitle) appSubtitle.textContent = trans.guest_guide ?? '';
      const heroBadge = document.getElementById('hero-badge');
      if (heroBadge) heroBadge.textContent = trans.guest_badge ?? '';
      const weatherDescEl2 = document.getElementById('weather-desc');
      if (weatherDescEl2 && (weatherDescEl2.textContent === 'Loading...' || weatherDescEl2.textContent === 'Nalaganje...' || weatherDescEl2.textContent === 'Laden...' || weatherDescEl2.textContent === 'Caricamento...')) {
        weatherDescEl2.textContent = trans.weather_loading ?? 'Loading...';
      }
      
      const langSelect = document.getElementById('lang-select');
      if (langSelect) {
        langSelect.value = lang;
      }

      // Save language preference instantly
      localStorage.setItem('preferredLanguage', lang);
      
      // Update brand/title text — always use apartment_name from config (never trans.brand_title)
      const _siteName = defaultConfig.apartment_name || 'DOLINA SOČE';
      const appTitle = document.getElementById('app-title');
      if (appTitle) appTitle.textContent = _siteName;

      const heroTitle = document.getElementById('hero-title');
      if (heroTitle) heroTitle.textContent = _siteName.split(' ')[0];
      
      // Welcome subtitle stays static - "SOČA VALLEY" - don't update it
      
      // Update weather description when language changes (re-render text only if we have cached data)
      const weatherDescEl = document.getElementById('weather-desc');
      if (weatherDescEl && weatherDescEl.textContent && weatherDescEl.textContent !== (translations[currentLang]?.weather_loading || 'Loading...')) {
        // Try to get cached weather code and re-render description
        try {
          const cached = localStorage.getItem(WEATHER_CACHE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.weatherCode != null) {
              const weatherInfo = weatherCodeToIconAndText(parsed.weatherCode, currentLang);
              weatherDescEl.textContent = weatherInfo.text;
              // Re-apply weather scene with cached code
              setHeaderWeatherSceneFromWmo(parsed.weatherCode, parsed.moonPhase);
            }
          }
        } catch (e) {
          // If no cached code, just update location text
      updateWeatherLocation();
        }
      } else {
        updateWeatherLocation();
      }
      
      // Update attractions content if screen is open
      const attractionsScreen = document.getElementById('attractions-screen');
      if (attractionsScreen && attractionsScreen.classList.contains('show')) {
        renderAttractionsContent();
      }
      
      // Update parking panel if open
      const parkingPanel = document.getElementById('parking-panel');
      if (parkingPanel && parkingPanel.classList.contains('open')) {
        const apartmentAddress = defaultConfig.full_address || 'Trg golobarskih žrtev 12, 5230 Bovec, Slovenija';
        const currentTown = window.APP.utils.getTownFromAddress(apartmentAddress);
        const container = document.getElementById('parking-dynamic');
        if (container && container.innerHTML) {
          const filteredOptions = (parkingOptionsCache || parkingFallbackData).filter(p => p.town === currentTown);
          renderParkingPanel(filteredOptions, currentTown);
        }
      }
      
      // Update emergency panel if open
      const emergencyPanel = document.getElementById('emergency-panel');
      if (emergencyPanel && emergencyPanel.classList.contains('open')) {
        renderEmergencyContent();
      }
      
      // Update taxi/bus screen if open
      const taxiBusScreen = document.getElementById('taxi-bus-screen');
      if (taxiBusScreen && taxiBusScreen.classList.contains('show')) {
        renderTaxiBusContent();
      }
      
      // Update adrenalin screen if open
      const adrenalinScreen = document.getElementById('adrenalin-screen');
      if (adrenalinScreen && adrenalinScreen.classList.contains('show')) {
        renderAdrenalinContent();
      }
      
      // Update daily essentials screen if open
      const dailyEssentialsScreen = document.getElementById('daily-essentials-screen');
      if (dailyEssentialsScreen && dailyEssentialsScreen.classList.contains('show')) {
        renderDailyEssentialsContent();
      }
      var parkingBackLabel = document.getElementById('parking-back-label');
      if (parkingBackLabel) parkingBackLabel.textContent = (trans.back_btn || 'Nazaj');
      var parkingBackBtn = document.getElementById('parking-back');
      if (parkingBackBtn) parkingBackBtn.setAttribute('aria-label', trans.back_btn || 'Nazaj');
      var parkingScreen = document.getElementById('parking-screen');
      if (parkingScreen && parkingScreen.classList.contains('show')) {
        renderParkingPageContent();
      }
      // Re-render base rules for the new language (only if DB rules were previously loaded)
      if (_baseRulesDJ) _applyBaseRulesToPanel(_baseRulesDJ);
    }

    // Initialize with saved language
    try {
      updateLanguage(currentLang);
    } catch (e) {
      // Ensure welcome screen still works even if language init fails
      console.error('Language initialization error:', e);
    }

    // Language dropdown
      const langSelect = document.getElementById('lang-select');
      if (langSelect) {
        langSelect.value = currentLang;
        langSelect.addEventListener('change', (e) => {
          updateLanguage(e.target.value);
        });
      }

    // Accordion panels
    // Cache for emergency services fetched from Supabase (null = not yet loaded)
    var _emergencyDbCache = null;

    // Fetches global emergency services from Supabase once; re-renders panel if open.
    // Falls back silently to hardcoded APP_DATA if fetch fails or returns empty.
    function loadGlobalSiteName() {
      if (!window.supabaseClient || typeof window.supabaseClient.from !== 'function') return;
      window.supabaseClient
        .from('items')
        .select('data_json')
        .eq('section_key', 'ui')
        .eq('item_key', 'site_name')
        .is('tenant_id', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(function (r) {
          if (r.error || !r.data || !r.data.data_json) return;
          var dj = r.data.data_json;
          if (dj.name) {
            defaultConfig.apartment_name = dj.name;
            var at = document.getElementById('app-title');
            if (at) at.textContent = dj.name;
            var ht = document.getElementById('hero-title');
            if (ht) ht.textContent = dj.name;
          }
          if (dj.subtitle) {
            defaultConfig.location_subtitle = dj.subtitle;
            var hl = document.getElementById('hero-location');
            if (hl) hl.textContent = dj.subtitle;
          }
        })
        .catch(function () {});
    }

    function loadCardLabelOverrides() {
      if (!window.supabaseClient || typeof window.supabaseClient.from !== 'function') return;
      window.supabaseClient
        .from('items')
        .select('data_json')
        .eq('item_key', 'card_labels')
        .is('tenant_id', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(function (r) {
          if (r.error || !r.data || !r.data.data_json) return;
          var overrides = r.data.data_json; // { sl: {key:val,...}, en: {...}, ... }
          // Merge overrides into APP.translations — only non-empty values
          var trans = window.APP && window.APP.translations;
          if (!trans) return;
          Object.keys(overrides).forEach(function (lang) {
            if (!trans[lang]) return;
            var langOverrides = overrides[lang] || {};
            Object.keys(langOverrides).forEach(function (key) {
              if (langOverrides[key] && langOverrides[key].trim()) {
                trans[lang][key] = langOverrides[key].trim();
              }
            });
          });
          // Re-apply current language so cards get updated text immediately
          if (typeof updateLanguage === 'function') {
            updateLanguage(currentLang || 'sl');
          }
        })
        .catch(function () {});
    }

    function loadEmergencyFromDb() {
      if (_emergencyDbCache !== null) return; // already fetched
      if (!window.supabaseClient || typeof window.supabaseClient.from !== 'function') return;
      var _munE = window._appMunicipality || 'bovec';
      window.supabaseClient
        .from('items')
        .select('data_json, "order"')
        .eq('section_key', 'emergency')
        .is('tenant_id', null)
        .eq('visible', true)
        .or('municipality_slugs.is.null,municipality_slugs.cs.{' + _munE + '}')
        .order('order', { ascending: true })
        .then(function (r) {
          if (r.error || !r.data || !r.data.length) return; // keep hardcoded fallback
          _emergencyDbCache = r.data.map(function (row) {
            var dj = row.data_json || {};
            return { name: dj.name || '', address: dj.address || '', phone: dj.phone || '',
                     tel: dj.tel || '', web: dj.web || '', directions: dj.directions || '' };
          });
          // Refresh panel only if it is currently open
          var panel = document.getElementById('emergency-panel');
          if (panel && panel.classList.contains('open')) renderEmergencyContent();
        })
        .catch(function () {}); // silent — hardcoded fallback remains
    }

    function renderEmergencyContent() {
      const emergencyList = document.getElementById('emergency-list-content');
      if (!emergencyList) return;
      
      const trans = translations[currentLang];
      if (!trans) return;
      
      // Reset scroll position before rendering
      const panelContent = emergencyList.closest('.panel-content');
      if (panelContent) {
        panelContent.scrollTop = 0;
      }
      
      let html = '';
      
      // Emergency numbers 112 and 113
      html += `<div class="quick-help-emergency-item">
        <div class="quick-help-emergency-number">112</div>
        <div class="quick-help-emergency-label">${trans.emergency_112 || 'Emergency'}</div>
        <a href="tel:112" class="quick-help-call-btn">${trans.call || 'Pozovi'}</a>
      </div>`;
      
      html += `<div class="quick-help-emergency-item">
        <div class="quick-help-emergency-number">113</div>
        <div class="quick-help-emergency-label">${trans.emergency_113 || 'Police'}</div>
        <a href="tel:113" class="quick-help-call-btn">${trans.call || 'Pozovi'}</a>
      </div>`;
      
      // Services list — prefer Supabase DB data, fall back to hardcoded APP_DATA
      const services = (_emergencyDbCache && _emergencyDbCache.length)
        ? _emergencyDbCache
        : ((CL && CL.getDataset('emergencyServices')) || []).map(function(s) {
            return { name: trans[s.nameKey] || s.nameDefault, address: s.address, phone: s.phone, tel: s.tel, web: s.web, directions: s.directions };
          });
      
      services.forEach(service => {
        html += `<div class="quick-help-service-item">
          <div class="quick-help-service-name">${service.name}</div>`;
        if (service.address) {
          html += `<div class="quick-help-service-address">${service.address}</div>`;
        }
        html += `<div class="quick-help-service-phone">${service.phone}</div>`;
        if (service.web) {
          html += `<a href="https://${service.web}" target="_blank" rel="noopener noreferrer" class="quick-help-service-web">${service.web}</a>`;
        }
        html += `<div class="quick-help-service-actions">
          <a href="${service.tel}" class="quick-help-call-btn">${trans.call || 'Pozovi'}</a>
          <a href="${service.directions}" target="_blank" rel="noopener noreferrer" class="quick-help-directions-btn">${trans.show_on_map || 'Show on map'}</a>
        </div>
        </div>`;
      });
      
      emergencyList.innerHTML = html;
      
      // Ensure scroll is active after content is rendered
      setTimeout(() => {
        const panelContent = emergencyList.closest('.panel-content');
        if (panelContent) {
          panelContent.scrollTop = 0;
          // Force scroll container to be active
          panelContent.style.overflowY = 'auto';
        }
      }, 10);
    }
    
    function openPanel(panelId) {
      if (activePanel && activePanel !== panelId) {
        document.getElementById(activePanel + '-panel').classList.remove('open');
      }
      const panel = document.getElementById(panelId + '-panel');
      panel.classList.add('open');
      activePanel = panelId;
      
      if (panelId === 'parking') {
        loadParkingOptions();
      }
      
      if (panelId === 'emergency') {
        loadEmergencyFromDb(); // pre-fetch from DB; re-renders automatically when ready
        renderEmergencyContent(); // render immediately with whatever is cached/hardcoded
        // Sačekaj da se panel otvori - skroluj na vrh da bude odmah na oku (nujno!)
        setTimeout(() => {
          const panelContent = panel.querySelector('.panel-content');
          if (panelContent) {
            panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setTimeout(() => { panelContent.scrollTop = 0; }, 200);
          }
        }, 100);
      } else if (panelId === 'rules') {
        // Hišni red isto na vrhu kao Nujno
        loadBaseRules(); // lazy-load base rules from DB on first open
        setTimeout(() => {
          const panelContent = panel.querySelector('.panel-content');
          if (panelContent) {
            panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setTimeout(() => { panelContent.scrollTop = 0; }, 200);
          }
        }, 100);
      } else {
        setTimeout(() => {
          panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    }

    function closePanel(panelId) {
      document.getElementById(panelId + '-panel').classList.remove('open');
      if (activePanel === panelId) {
        activePanel = null;
      }
    }

    document.querySelectorAll('.menu-card').forEach(card => {
      card.addEventListener('click', () => {
        const section = card.getAttribute('data-section');
        if (section === 'parking') {
          openParkingScreen();
        } else if (section) {
          openPanel(section);
        } else if (card.id === 'attractions-card') {
          openAttractions();
        } else if (card.id === 'daily-essentials-card') {
          openDailyEssentials();
        } else if (card.id === 'taxi-bus-card') {
          openTaxiBus();
        } else if (card.id === 'adrenalin-card') {
          openAdrenalin();
        } else if (card.id === 'maintenance-card') {
          openMaintenanceModal();
        }
      });
    });

    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        closePanel(btn.getAttribute('data-close'));
      });
    });

    // Info panel copy functions
    const copyAddressBtn = document.getElementById('copy-address-btn');
    if (copyAddressBtn) {
      copyAddressBtn.addEventListener('click', () => {
        const address = defaultConfig.full_address || 'Trg golobarskih žrtev 12, 5230 Bovec, Slovenija';
        window.APP.utils.copyToClipboard(address, translations[currentLang].address_copied, translations[currentLang].copied);
      });
    }

    const copyWifiInfoBtn = document.getElementById('copy-wifi-info-btn');
    if (copyWifiInfoBtn) {
      copyWifiInfoBtn.addEventListener('click', () => {
        const ssid = defaultConfig.wifi_ssid;
        const password = defaultConfig.wifi_password;
        const text = `SSID: ${ssid}\nPassword: ${password}`;
        window.APP.utils.copyToClipboard(text, translations[currentLang].wifi_copied, translations[currentLang].copied);
      });
    }

    const showQrBtn = document.getElementById('show-qr-btn');
    if (showQrBtn) {
      showQrBtn.addEventListener('click', () => {
        window.APP.utils.showToast(translations[currentLang].qr_coming);
      });
    }

    // Update info panel with config values
    function updateInfoPanel() {
      const addressEl = document.getElementById('info-address');
      if (addressEl) {
        addressEl.textContent = defaultConfig.full_address || 'Trg golobarskih žrtev 12, 5230 Bovec, Slovenija';
      }
      const checkinTimeEl = document.getElementById('checkin-time');
      if (checkinTimeEl) {
        checkinTimeEl.textContent = defaultConfig.checkin_time || '15:00';
      }
      const checkoutTimeEl = document.getElementById('checkout-time');
      if (checkoutTimeEl) {
        checkoutTimeEl.textContent = defaultConfig.checkout_time || '11:00';
      }
      const wifiSsidEl = document.getElementById('info-wifi-ssid');
      if (wifiSsidEl) {
        wifiSsidEl.textContent = defaultConfig.wifi_ssid || 'BovecMountain_5G';
      }
      const wifiPasswordEl = document.getElementById('info-wifi-password');
      if (wifiPasswordEl) {
        wifiPasswordEl.textContent = defaultConfig.wifi_password || 'AlpineView2024';
      }
      const directionsLink = document.getElementById('directions-link');
      if (directionsLink && defaultConfig.maps_link) {
        directionsLink.href = defaultConfig.maps_link;
      }
      const hostCallLink = document.getElementById('host-call-link');
      if (hostCallLink && defaultConfig.host_phone) {
        hostCallLink.href = `tel:${defaultConfig.host_phone.replace(/\s/g, '')}`;
      }
      const hostWhatsappLink = document.getElementById('host-whatsapp-link');
      if (hostWhatsappLink && defaultConfig.host_whatsapp) {
        hostWhatsappLink.href = `https://wa.me/${defaultConfig.host_whatsapp.replace(/[^\d]/g, '')}`;
      }
    }

    updateInfoPanel();

    const directionsAction = document.getElementById('directions-action');
    if (directionsAction && defaultConfig.maps_link) {
      directionsAction.href = defaultConfig.maps_link;
    }

    // ── Tenant override application (called async after TenantLoader resolves) ──
    function applyTenantOverrides(ov) {
      if (!ov) return;
      window.__TENANT_OVERRIDES = window.__TENANT_OVERRIDES || {};

      // 1) Safe config fields from tenant override + quick actions
      if (ov.config) {
        var _oc = ov.config;
        // apartment_name / full_address (direct keys)
        if (_oc.apartment_name) defaultConfig.apartment_name = _oc.apartment_name;
        if (_oc.full_address)   defaultConfig.full_address   = _oc.full_address;
        // DB may use compact keys (phone, nav_link, checkin, checkout) OR legacy full keys
        var _ocPhone = _oc.phone      || _oc.host_phone;
        var _ocNav   = _oc.nav_link   || _oc.maps_link;
        var _ocCi    = _oc.checkin    || _oc.checkin_time;
        var _ocCo    = _oc.checkout   || _oc.checkout_time;
        if (_ocPhone) { defaultConfig.host_phone    = _ocPhone;
                        defaultConfig.host_whatsapp = defaultConfig.host_whatsapp || _ocPhone; }
        if (_ocNav)   defaultConfig.maps_link      = _ocNav;
        if (_ocCi)    defaultConfig.checkin_time   = _ocCi;
        if (_ocCo)    defaultConfig.checkout_time  = _ocCo;
        updateInfoPanel(); // refresh address / checkin / checkout display
      }
      applyQuickActions(ov.config || null, new URLSearchParams(window.location.search).get('t'));

      // 2) Parking recommended — store override; renderParkingPanel reads it on each call
      if (ov.parkingRecommended && ov.parkingRecommended.title) {
        window.__TENANT_OVERRIDES.parkingRecommended = ov.parkingRecommended;
        // Re-render parking panel immediately if it is already visible
        var _pd = document.getElementById('parking-dynamic');
        if (_pd && _pd.children.length) { loadParkingOptions(); }
      }

      // 3) House rules private — inject into rules panel
      window.__TENANT_OVERRIDES.houseRulesPrivate = ov.houseRulesPrivate || null;
      applyPrivateRulesToUI();

      // 4) Maintenance card — show only if owner enabled it
      var maintCfg = ov.maintConfig || null;
      var maintCard = document.getElementById('maintenance-card');
      if (maintCard) {
        var show = !maintCfg || maintCfg.visible !== false;
        maintCard.style.display = show ? '' : 'none';
      }

      // 5) Owner biznis button — show only if this tenant has owner_config
      var bizCfg = ov.ownerBiznisConfig || null;
      var biznisBtn = document.getElementById('owner-biznis-btn');
      if (biznisBtn) {
        if (bizCfg && bizCfg.enabled !== false && bizCfg.name) {
          biznisBtn.style.display = '';
          window.__OWNER_BIZNIS_CFG = bizCfg;
          window._ownerBiznisSlug = ov.slug || null;
        } else {
          biznisBtn.style.display = 'none';
        }
      }
    }

    // ── Apply quick action links (call / directions / rules) ──────────────────
    function applyQuickActions(cfg, slug) {
      var _phone = (cfg && (cfg.quick_call_phone || cfg.host_phone)) || defaultConfig.host_phone || '';
      var _dirs  = (cfg && (cfg.quick_directions_link || cfg.maps_link)) || defaultConfig.maps_link || '';
      var _rulesBase = (cfg && (cfg.quick_rules_url || cfg.rules_url)) || './pravila/index.html';
      var _baseNoQ = _rulesBase.split('?')[0];
      var _isLocalPravila = _baseNoQ === './pravila/index.html' || _baseNoQ === '/pravila/index.html';
      var _rules = (_isLocalPravila && slug) ? (_baseNoQ + '?t=' + encodeURIComponent(slug)) : _rulesBase;

      if (_phone) {
        var _ca = document.getElementById('call-action');
        if (_ca) _ca.href = 'tel:' + _phone.replace(/\s+/g, '');
        var _hcl = document.getElementById('host-call-link');
        if (_hcl) _hcl.href = 'tel:' + _phone.replace(/\s+/g, '');
      }
      if (_dirs) {
        var _da = document.getElementById('directions-action');
        if (_da) _da.href = _dirs;
        var _dl = document.getElementById('directions-link');
        if (_dl) _dl.href = _dirs;
      }
      var _ra = document.getElementById('rules-action');
      if (_ra) _ra.href = _rules;
    }

    // ── Inject tenant private rules into #rules-panel ─────────────────────────
    // When tenant text exists: hide ALL static/generic rules, show only tenant text.
    // When no tenant text: restore static list visibility, remove injected block.
    function applyPrivateRulesToUI() {
      var hr = window.__TENANT_OVERRIDES && window.__TENANT_OVERRIDES.houseRulesPrivate;

      // Resolve text — support both {text:"..."} and {rules:[...]} formats
      var text = '';
      if (hr && typeof hr.text === 'string' && hr.text.trim()) {
        text = hr.text.trim();
      } else if (hr && Array.isArray(hr.rules) && hr.rules.length > 0) {
        text = hr.rules.join('\n');
      }

      var rulesPanel    = document.getElementById('rules-panel');
      var panelContent  = rulesPanel && rulesPanel.querySelector('.panel-content');
      var target        = panelContent || rulesPanel;
      var staticList    = rulesPanel  && rulesPanel.querySelector('.rules-list');
      var existing      = document.getElementById('tenant-private-rules');

      if (!text) {
        // No tenant text — show static list, remove any injected block
        if (staticList) staticList.style.display = '';
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
        return;
      }

      // Tenant text present — hide generic static list completely
      if (staticList) staticList.style.display = 'none';

      // Auto-detect icon per line keyword
      function _autoIcon(line) {
        var l = line.toLowerCase();
        if (/bučno|šum|glasno|hrup|tiho|tišina|mirno|noise|quiet/.test(l))        return '🔇';
        if (/kurit|kaditi|pušiti|pušenje|cigareta|smok/.test(l))                  return '🚭';
        if (/čisto|smeće|smeti|smetišče|čiščenj|odpad|clean|trash/.test(l))       return '🗑️';
        if (/ključ|zakleni|zakleniti|zaklep|key|lock/.test(l))                    return '🔐';
        if (/izhod|izlaz|odhod|check.?out|odlazak|departure/.test(l))             return '🚪';
        if (/parkira|parkirišče|parking/.test(l))                                 return '🅿️';
        if (/wifi|wi.?fi|internet|geslo|password|lozinka/.test(l))                return '📶';
        if (/gostje|gost|obiskovalci|prijava|check.?in|arrival|dolazak/.test(l))  return '👥';
        if (/žival|pes|mačka|hišni ljub|pet|ljubimac/.test(l))                   return '🐾';
        if (/kuhinja|kuhati|jedi|hrana|kitchen|food/.test(l))                     return '🍳';
        if (/kopa|tuš|kopalnica|brisač|shower|bath/.test(l))                     return '🚿';
        if (/postelj|rjuha|vzglavnik|posteljina|bed|linen/.test(l))               return '🛏️';
        if (/vrat|door|porta/.test(l))                                            return '🚪';
        if (/odmet|waste|recikl/.test(l))                                         return '♻️';
        return '📌';
      }

      // Build the block with one rule-item per non-empty line
      if (!existing) {
        existing = document.createElement('div');
        existing.id = 'tenant-private-rules';
        existing.style.cssText = 'margin:0;padding:0;display:flex;flex-direction:column;gap:0.85rem;';
        if (target) target.appendChild(existing);
      }
      existing.innerHTML = '';
      text.split(/\r?\n/).forEach(function (line) {
        var t = line.trim();
        if (!t) return;
        var item = document.createElement('div'); item.className = 'rule-item';
        var icon = document.createElement('span'); icon.className = 'rule-icon'; icon.textContent = _autoIcon(t);
        var p    = document.createElement('p');    p.className    = 'rule-text';
        p.style.cssText = 'font-size:0.92rem;line-height:1.6;color:var(--text-primary,#e2e8f0);margin:0;';
        p.textContent = t;
        item.appendChild(icon); item.appendChild(p);
        existing.appendChild(item);
      });
    }

    // ── Lazy-load base house rules from Supabase (global house_rules/base row) ───
    var _baseRulesState = 'idle'; // idle | loading | loaded | failed
    var _baseRulesDJ = null;     // cached DB data_json for language-switch re-render

    // Rebuilds the static hardcoded rules using current translations (restores after DB override)
    function _restoreI18nRules(rulesList) {
      if (!rulesList) return;
      rulesList.style.display = '';
      var trans = translations[currentLang] || translations.sl;
      var STATIC = [
        ['🔇','rule1'], ['🚭','rule2'], ['🗑️','rule3'], ['🔐','rule4'], ['🚪','rule5']
      ];
      rulesList.innerHTML = '';
      STATIC.forEach(function (r) {
        var div  = document.createElement('div');  div.className  = 'rule-item';
        var icon = document.createElement('span'); icon.className = 'rule-icon'; icon.textContent = r[0];
        var p    = document.createElement('p');    p.className    = 'rule-text';  p.textContent    = trans[r[1]] || '';
        div.appendChild(icon); div.appendChild(p);
        rulesList.appendChild(div);
      });
    }

    // Renders DB base rules for current language; restores translated static rules when DB data
    // doesn't cover the active language (single-lang DB content is treated as Slovenian only).
    function _applyBaseRulesToPanel(dj) {
      var rulesList = document.querySelector('#rules-panel .rules-list');
      if (!rulesList) return;
      rulesList.style.display = '';
      var baseItems = [];
      // Multilingual format: dj.by_lang or dj.items_by_lang → { "sl":[...], "en":[...], ... }
      var byLang = dj.by_lang || dj.items_by_lang;
      if (byLang && typeof byLang === 'object') {
        var langItems = byLang[currentLang] || byLang.en || byLang.sl || [];
        if (Array.isArray(langItems) && langItems.length > 0) baseItems = langItems;
      }
      // Single-language fallback: only apply for Slovenian (DB content assumed to be in Slovenian)
      if (!baseItems.length && currentLang === 'sl') {
        if (Array.isArray(dj.items) && dj.items.length > 0) {
          baseItems = dj.items;
        } else if (typeof dj.text === 'string' && dj.text.trim()) {
          // Free-text format: render as ONE pre-wrap block — do NOT split into bullet items
          rulesList.innerHTML = '';
          var _tp = document.createElement('p');
          _tp.className = 'rule-text';
          _tp.style.cssText = 'white-space:pre-line;line-height:1.65;padding:0.25rem 0';
          _tp.textContent = dj.text.trim();
          rulesList.appendChild(_tp);
          return;
        }
      }
      // No usable data for this language → restore translated static rules
      if (!baseItems.length) { _restoreI18nRules(rulesList); return; }
      rulesList.innerHTML = '';
      baseItems.forEach(function (txt) {
        var div  = document.createElement('div');  div.className  = 'rule-item';
        var icon = document.createElement('span'); icon.className = 'rule-icon'; icon.textContent = '•';
        var p    = document.createElement('p');    p.className    = 'rule-text';  p.textContent    = txt;
        div.appendChild(icon); div.appendChild(p);
        rulesList.appendChild(div);
      });
      if (window.__DEBUG) console.log('[BASE-RULES] rendered', baseItems.length, 'items for lang:', currentLang);
    }

    function loadBaseRules() {
      if (_baseRulesState !== 'idle') return; // already loading or loaded
      if (!window.supabaseClient || typeof window.supabaseClient.from !== 'function') return;
      _baseRulesState = 'loading';
      // Show loading placeholder immediately — prevents flash of static/i18n text
      var _rl = document.querySelector('#rules-panel .rules-list');
      if (_rl) { _rl.style.display = ''; _rl.innerHTML = '<p style="opacity:0.5;font-size:0.9rem;padding:0.25rem 0">Učitavam\u2026</p>'; }
      window.supabaseClient
        .from('items')
        .select('data_json')
        .eq('section_key', 'house_rules')
        .eq('item_key', 'base')
        .eq('visible', true)
        .is('tenant_id', null)
        .maybeSingle()
        .then(function (r) {
          _baseRulesState = 'loaded';
          if (r.error || !r.data || !r.data.data_json) {
            // No DB data — restore translated static rules
            _restoreI18nRules(document.querySelector('#rules-panel .rules-list'));
            return;
          }
          _baseRulesDJ = r.data.data_json;
          _applyBaseRulesToPanel(_baseRulesDJ);
        })
        .catch(function () {
          _baseRulesState = 'failed';
          _restoreI18nRules(document.querySelector('#rules-panel .rules-list'));
        });
    }

    // Close all panels
    function closeAllPanels() {
      document.querySelectorAll('.accordion-panel').forEach(panel => {
        panel.classList.remove('open');
      });
      activePanel = null;
    }

    const PARKING_DATA_PATH = 'assets/data/parking';
    var parkingDataFromFolder = null;

    function loadParkingFromFolder() {
      fetch(PARKING_DATA_PATH + '/list.txt').then(function(r) { return r.ok ? r.text() : Promise.reject(); }).then(function(text) {
        var ids = text.split(/\r?\n/).map(function(s) { return s.trim(); }).filter(Boolean);
        if (ids.length === 0) { parkingDataFromFolder = null; return; }
        Promise.all(ids.map(function(id) {
          return fetch(PARKING_DATA_PATH + '/' + id + '.json').then(function(res) { return res.ok ? res.json() : null; }).catch(function() { return null; });
        })).then(function(results) {
          var list = results.filter(Boolean);
          parkingDataFromFolder = list.length ? list : null;
        });
      }).catch(function() {
        parkingDataFromFolder = null;
      });
    }

    function getParkingList() {
      return (parkingDataFromFolder && parkingDataFromFolder.length) ? parkingDataFromFolder : parkingFallbackData;
    }

    const parkingFallbackData = [
      // Bovec options
      {
        id: 'bovec-apartment',
        title: { sl: 'Parkirno mesto apartmaja', en: 'Apartment parking', de: 'Apartment-Parkplatz', it: 'Parcheggio appartamento' },
        address: 'Trg golobarskih žrtev 12, 5230 Bovec',
        town: 'Bovec',
        type: 'apartment',
        paid: false,
        hours: '24/7',
        notes: { sl: 'Brezplačno za goste apartmaja', en: 'Free for apartment guests', de: 'Kostenlos für Apartment-Gäste', it: 'Gratuito per gli ospiti dell\'appartamento' },
        mapsQuery: 'Trg golobarskih žrtev 12, 5230 Bovec, Slovenija'
      },
      {
        id: 'bovec-center',
        title: { sl: 'Parkiranje v centru Bovec', en: 'Bovec center parking', de: 'Parken im Zentrum Bovec', it: 'Parcheggio centro Bovec' },
        address: 'Trg golobarskih žrtev, Bovec',
        town: 'Bovec',
        type: 'public',
        paid: true,
        hours: '24/7',
        notes: { sl: 'Uradno parkirno mesto u centru', en: 'Official parking in town center', de: 'Offizieller Parkplatz im Stadtzentrum', it: 'Parcheggio ufficiale nel centro città' },
        mapsQuery: 'Trg golobarskih žrtev, 5230 Bovec, Slovenija'
      },
      {
        id: 'bovec-sport',
        title: { sl: 'Športni center Bovec', en: 'Sports center Bovec', de: 'Sportzentrum Bovec', it: 'Centro sportivo Bovec' },
        address: 'Športni center, Bovec',
        town: 'Bovec',
        type: 'public',
        paid: true,
        hours: '24/7',
        notes: { sl: 'Uradno parkirno mesto ob športnem centru', en: 'Official parking near sports center', de: 'Offizieller Parkplatz am Sportzentrum', it: 'Parcheggio ufficiale vicino al centro sportivo' },
        mapsQuery: 'Športni center Bovec, 5230 Bovec, Slovenija'
      },
      {
        id: 'bovec-kanin',
        title: { sl: 'Parkiranje ob Kaninu', en: 'Kanin parking', de: 'Kanin Parken', it: 'Parcheggio Kanin' },
        address: 'Kanin, Bovec',
        town: 'Bovec',
        type: 'public',
        paid: true,
        hours: '24/7',
        notes: { sl: 'Uradno parkirno mesto ob žičnici', en: 'Official parking near cable car', de: 'Offizieller Parkplatz an der Seilbahn', it: 'Parcheggio ufficiale vicino alla funivia' },
        mapsQuery: 'Kanin cable car parking, 5230 Bovec, Slovenija'
      },
      // Kobarid options
      {
        id: 'kobarid-apartment',
        title: { sl: 'Parkirno mesto apartmaja', en: 'Apartment parking', de: 'Apartment-Parkplatz', it: 'Parcheggio appartamento' },
        address: 'Kobarid',
        town: 'Kobarid',
        type: 'apartment',
        paid: false,
        hours: '24/7',
        notes: { sl: 'Brezplačno za goste apartmaja', en: 'Free for apartment guests', de: 'Kostenlos für Apartment-Gäste', it: 'Gratuito per gli ospiti dell\'appartamento' },
        mapsQuery: 'Kobarid, Slovenija'
      },
      {
        id: 'kobarid-center',
        title: { sl: 'Parkiranje v centru Kobarid', en: 'Kobarid center parking', de: 'Parken im Zentrum Kobarid', it: 'Parcheggio centro Kobarid' },
        address: 'Trg svobode, Kobarid',
        town: 'Kobarid',
        type: 'public',
        paid: true,
        hours: '24/7',
        notes: { sl: 'Uradno parkirno mesto u centru', en: 'Official parking in town center', de: 'Offizieller Parkplatz im Stadtzentrum', it: 'Parcheggio ufficiale nel centro città' },
        mapsQuery: 'Trg svobode, Kobarid, Slovenija'
      },
      {
        id: 'kobarid-museum',
        title: { sl: 'Parkiranje ob muzeju', en: 'Museum parking', de: 'Museum Parken', it: 'Parcheggio museo' },
        address: 'Kobaridski muzej, Kobarid',
        town: 'Kobarid',
        type: 'public',
        paid: true,
        hours: '24/7',
        notes: { sl: 'Uradno parkirno mesto ob muzeju', en: 'Official parking near museum', de: 'Offizieller Parkplatz am Museum', it: 'Parcheggio ufficiale vicino al museo' },
        mapsQuery: 'Kobaridski muzej, Kobarid, Slovenija'
      },
      {
        id: 'kobarid-soca',
        title: { sl: 'Parkiranje ob Soči', en: 'Soča river parking', de: 'Soča Fluss Parken', it: 'Parcheggio fiume Soča' },
        address: 'Ob Soči, Kobarid',
        town: 'Kobarid',
        type: 'public',
        paid: false,
        hours: '24/7',
        notes: { sl: 'Uradno parkirno mesto ob reki Soči', en: 'Official parking near Soča river', de: 'Offizieller Parkplatz am Soča Fluss', it: 'Parcheggio ufficiale vicino al fiume Soča' },
        mapsQuery: 'Soča river parking, Kobarid, Slovenija'
      },
      // Tolmin options
      {
        id: 'tolmin-apartment',
        title: { sl: 'Parkirno mesto apartmaja', en: 'Apartment parking', de: 'Apartment-Parkplatz', it: 'Parcheggio appartamento' },
        address: 'Tolmin',
        town: 'Tolmin',
        type: 'apartment',
        paid: false,
        hours: '24/7',
        notes: { sl: 'Brezplačno za goste apartmaja', en: 'Free for apartment guests', de: 'Kostenlos für Apartment-Gäste', it: 'Gratuito per gli ospiti dell\'appartamento' },
        mapsQuery: 'Tolmin, Slovenija'
      },
      {
        id: 'tolmin-center',
        title: { sl: 'Parkiranje v centru Tolmin', en: 'Tolmin center parking', de: 'Parken im Zentrum Tolmin', it: 'Parcheggio centro Tolmin' },
        address: 'Trg 1. maja, Tolmin',
        town: 'Tolmin',
        type: 'public',
        paid: true,
        hours: '24/7',
        notes: { sl: 'Uradno parkirno mesto u centru', en: 'Official parking in town center', de: 'Offizieller Parkplatz im Stadtzentrum', it: 'Parcheggio ufficiale nel centro città' },
        mapsQuery: 'Trg 1. maja, Tolmin, Slovenija'
      },
      {
        id: 'tolmin-gorge',
        title: { sl: 'Parkiranje ob Tolminski koriti', en: 'Tolmin Gorge parking', de: 'Tolminer Schlucht Parken', it: 'Parcheggio Gola di Tolmin' },
        address: 'Tolminska korita, Tolmin',
        town: 'Tolmin',
        type: 'public',
        paid: true,
        hours: '24/7',
        notes: { sl: 'Uradno parkirno mesto ob koritu', en: 'Official parking near gorge', de: 'Offizieller Parkplatz an der Schlucht', it: 'Parcheggio ufficiale vicino alla gola' },
        mapsQuery: 'Tolminska korita, Tolmin, Slovenija'
      },
      {
        id: 'tolmin-sport',
        title: { sl: 'Športni park Tolmin', en: 'Sports park Tolmin', de: 'Sportpark Tolmin', it: 'Parco sportivo Tolmin' },
        address: 'Športni park, Tolmin',
        town: 'Tolmin',
        type: 'public',
        paid: true,
        hours: '24/7',
        notes: { sl: 'Uradno parkirno mesto ob športnem parku', en: 'Official parking near sports park', de: 'Offizieller Parkplatz am Sportpark', it: 'Parcheggio ufficiale vicino al parco sportivo' },
        mapsQuery: 'Športni park, Tolmin, Slovenija'
      }
    ];
    
    const parkingDataSources = [
      {
        town: 'Bovec',
        kind: 'json',
        url: 'OFFICIAL_URL_HERE',
        officialLabel: { sl: 'Občina Bovec', en: 'Bovec Municipality', de: 'Gemeinde Bovec', it: 'Comune di Bovec' },
        parse: function(raw) {
          try {
            const data = JSON.parse(raw);
            return data.parking || [];
          } catch (e) {
            return [];
          }
        }
      },
      {
        town: 'Kobarid',
        kind: 'json',
        url: 'OFFICIAL_URL_HERE',
        officialLabel: { sl: 'Občina Kobarid', en: 'Kobarid Municipality', de: 'Gemeinde Kobarid', it: 'Comune di Kobarid' },
        parse: function(raw) {
          try {
            const data = JSON.parse(raw);
            return data.parking || [];
          } catch (e) {
            return [];
          }
        }
      },
      {
        town: 'Tolmin',
        kind: 'json',
        url: 'OFFICIAL_URL_HERE',
        officialLabel: { sl: 'Občina Tolmin', en: 'Tolmin Municipality', de: 'Gemeinde Tolmin', it: 'Comune di Tolmin' },
        parse: function(raw) {
          try {
            const data = JSON.parse(raw);
            return data.parking || [];
          } catch (e) {
            return [];
          }
        }
      }
    ];
    
    let parkingOptionsCache = null;
    const PARKING_CACHE_KEY = 'parkingOptionsCache';
    const PARKING_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
    
    async function loadParkingOptions() {
      const container = document.getElementById('parking-dynamic');
      const status = document.getElementById('parking-status');
      
      if (!container) return;
      
      // Determine town from apartment address
      const apartmentAddress = defaultConfig.full_address || 'Trg golobarskih žrtev 12, 5230 Bovec, Slovenija';
      const currentTown = window.APP.utils.getTownFromAddress(apartmentAddress);
      
      // Filter parking options by town
      let filteredOptions = parkingFallbackData.filter(p => p.town === currentTown);
      
      // Update apartment parking address if needed
      const apartmentOption = filteredOptions.find(p => p.type === 'apartment');
      if (apartmentOption) {
        apartmentOption.address = apartmentAddress.split(',')[0] + (apartmentAddress.includes(currentTown) ? '' : `, ${currentTown}`);
        apartmentOption.mapsQuery = apartmentAddress;
      }
      
      // Limit to apartment + 3 public options
      const apartmentParking = filteredOptions.filter(p => p.type === 'apartment');
      const publicParking = filteredOptions.filter(p => p.type === 'public').slice(0, 3);
      filteredOptions = [...apartmentParking, ...publicParking];
      
      // Show filtered options immediately
      renderParkingPanel(filteredOptions, currentTown);
      if (status) {
        status.textContent = translations[currentLang].parking_loading;
      }
      
      // Try to load from cache first
      try {
        const cached = localStorage.getItem(PARKING_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < PARKING_CACHE_TTL && parsed.town === currentTown) {
            parkingOptionsCache = parsed.data;
            renderParkingPanel(parsed.data, currentTown);
            if (status) {
              status.textContent = translations[currentLang].parking_updated_from_official;
            }
            return;
          }
        }
      } catch (e) {}
      
      // Try to fetch from official sources
      let fetched = false;
      for (const source of parkingDataSources) {
        if (source.url === 'OFFICIAL_URL_HERE' || source.town !== currentTown) continue;
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(source.url, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const raw = await response.text();
            const parsed = source.parse(raw);
            if (parsed && parsed.length > 0) {
              const apartmentParking = filteredOptions.find(p => p.type === 'apartment');
              const merged = apartmentParking ? [apartmentParking, ...parsed] : parsed;
              parkingOptionsCache = merged;
              renderParkingPanel(merged, currentTown);
              localStorage.setItem(PARKING_CACHE_KEY, JSON.stringify({
                data: merged,
                town: currentTown,
                timestamp: Date.now()
              }));
              if (status) {
                status.textContent = translations[currentLang].parking_updated_from_official;
              }
              fetched = true;
              break;
            }
          }
        } catch (e) {
          // Continue to next source or fallback
        }
      }
      
      if (!fetched) {
        parkingOptionsCache = filteredOptions;
        renderParkingPanel(filteredOptions, currentTown);
        if (status) {
          status.textContent = translations[currentLang].parking_fallback_notice || '';
        }
      }
    }
    
    function renderParkingPanel(options, town) {
      const container = document.getElementById('parking-dynamic');
      if (!container) return;
      
      const trans = translations[currentLang];
      let recommended = options.filter(p => p.type === 'apartment');
      const others = options.filter(p => p.type !== 'apartment');

      // Tenant override: replace first recommended card only
      var _tpo = window.__TENANT_OVERRIDES && window.__TENANT_OVERRIDES.parkingRecommended;
      if (_tpo && _tpo.title) {
        // Handle both old plain-string format and new {sl,en} object format
        var _tpoTitle = (typeof _tpo.title === 'object') ? _tpo.title : { sl: _tpo.title, en: _tpo.title };
        var _tpoNotes = _tpo.notes ? ((typeof _tpo.notes === 'object') ? _tpo.notes : { sl: _tpo.notes, en: _tpo.notes }) : null;
        var _tpoC = { type: 'apartment', title: _tpoTitle, address: _tpo.address || '', mapsLink: _tpo.mapsLink || '', notes: _tpoNotes, paid: null, hours: null };
        recommended = [_tpoC].concat(recommended.slice(1));
      }

      let html = '';
      
      if (recommended.length > 0) {
        html += '<div style="margin-bottom: 1.5rem;"><h4 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; color: var(--accent);">⭐ ' + trans.parking_recommended + '</h4>';
        recommended.forEach(opt => {
          html += renderParkingCard(opt, true);
        });
        html += '</div>';
      }
      
      if (others.length > 0) {
        html += '<div><h4 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem;">' + trans.parking_more_options + '</h4>';
        others.forEach(opt => {
          html += renderParkingCard(opt, false);
        });
        html += '</div>';
      }
      
      container.innerHTML = html;
    }
    
    function renderParkingCard(opt, isRecommended) {
      const trans = translations[currentLang];
      const title = opt.title[currentLang] || opt.title.sl || opt.title.en;
      const notes = opt.notes ? (opt.notes[currentLang] || opt.notes.sl || opt.notes.en) : null;
      
      // Use directions link instead of search
      const mapsLink = opt.mapsLink || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(opt.mapsQuery || opt.address)}`;
      
      let html = '<div class="parking-card' + (isRecommended ? ' recommended' : '') + '">';
      html += '<div class="parking-card-header">';
      html += '<div><div class="parking-card-title">' + (isRecommended ? '⭐ ' : '') + title + '</div>';
      html += '<div class="parking-card-address">📍 ' + opt.address + '</div></div>';
      if (opt.paid !== null) {
        html += '<span class="parking-badge ' + (opt.paid ? 'paid' : 'free') + '">' + (opt.paid ? trans.parking_paid_badge : trans.parking_free_badge) + '</span>';
      }
      html += '</div>';
      
      if (opt.hours) {
        html += '<div class="parking-card-details"><strong>' + trans.parking_hours_label + '</strong> ' + opt.hours + '</div>';
      }
      
      if (notes) {
        html += '<div class="parking-card-details"><strong>' + trans.parking_notes_label + '</strong> ' + notes + '</div>';
      }
      
      html += '<div class="parking-card-actions">';
      html += '<a href="' + mapsLink + '" target="_blank" rel="noopener noreferrer" class="call-btn" style="width: 100%; text-align: center; color: #111;">' + (trans.parking_btn_location || 'Lokacija') + '</a>';
      html += '</div></div>';
      
      return html;
    }

    function renderParkingPageContent() {
      var body = document.getElementById('parking-body');
      if (!body) return;
      var list = getParkingList();
      var apartmentAddress = defaultConfig.full_address || 'Trg golobarskih žrtev 12, 5230 Bovec, Slovenija';
      var currentTown = window.APP.utils.getTownFromAddress(apartmentAddress);
      var filtered = list.filter(function(p) { return p.town === currentTown; });
      var apartmentOpt = filtered.find(function(p) { return p.type === 'apartment'; });
      if (apartmentOpt) {
        apartmentOpt.address = apartmentAddress.split(',')[0] + (apartmentAddress.indexOf(currentTown) !== -1 ? '' : ', ' + currentTown);
        apartmentOpt.mapsQuery = apartmentAddress;
      }
      var recommended = filtered.filter(function(p) { return p.type === 'apartment'; });
      var others = filtered.filter(function(p) { return p.type !== 'apartment'; });

      // Tenant override: replace first recommended card only
      var _tpo2 = window.__TENANT_OVERRIDES && window.__TENANT_OVERRIDES.parkingRecommended;
      if (_tpo2 && _tpo2.title) {
        var _tpoC2 = { type: 'apartment', title: { sl: _tpo2.title, en: _tpo2.title }, address: _tpo2.address || '', mapsLink: _tpo2.mapsLink || '', notes: _tpo2.notes ? { sl: _tpo2.notes, en: _tpo2.notes } : null, paid: null, hours: null };
        recommended = [_tpoC2].concat(recommended.slice(1));
      }

      var trans = translations[currentLang];
      var html = '';
      if (recommended.length > 0) {
        html += '<div style="margin-bottom: 1.5rem;"><h4 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; color: var(--accent);">⭐ ' + trans.parking_recommended + '</h4>';
        recommended.forEach(function(opt) { html += renderParkingCard(opt, true); });
        html += '</div>';
      }
      if (others.length > 0) {
        html += '<div><h4 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem;">' + trans.parking_more_options + '</h4>';
        others.forEach(function(opt) { html += renderParkingCard(opt, false); });
        html += '</div>';
      }
      body.innerHTML = html || '<p style="padding: 1rem; color: var(--text-secondary);">' + (trans.parking_loading || 'Nalaganje...') + '</p>';
    }

    function showParkingScreen() {
      var screen = document.getElementById('parking-screen');
      if (screen) {
        screen.classList.add('show');
        renderParkingPageContent();
        var backLabel = document.getElementById('parking-back-label');
        if (backLabel) backLabel.textContent = (translations[currentLang] && translations[currentLang].back_btn) || 'Nazaj';
        var backBtn = document.getElementById('parking-back');
        if (backBtn) backBtn.setAttribute('aria-label', (translations[currentLang] && translations[currentLang].back_btn) || 'Nazaj');
        history.pushState({ overlay: 'parking' }, '', window.location.pathname + window.location.search + (window.location.hash || ''));
      }
    }

    function hideParkingScreen() {
      var screen = document.getElementById('parking-screen');
      if (screen) screen.classList.remove('show');
    }

    function openParkingScreen() {
      closeAllPanels();
      showParkingScreen();
    }

    function closeParkingScreen() {
      hideParkingScreen();
      if (window.APP && window.APP.utils && window.APP.utils.scrollToTopReliable) {
        window.APP.utils.scrollToTopReliable();
      }
    }
    
    // Trip Ideas data structure
    const tripIdeasData = (CL && CL.getDataset('tripIdeasData')) || {};
    const tripIdeasPlaces = (CL && CL.getDataset('tripIdeasPlaces')) || ['tolmin', 'kobarid', 'srpenica', 'zaga', 'bovec', 'cezso\u010da', 'vodenca'];
    
    // ATTRACTIONS DATA MODEL
    const ATTRACTIONS = (CL && CL.getDataset('attractions')) || {};

    /* ATTRACTIONS_PLACEHOLDER_START — remove after confirming window.APP_DATA loads correctly
    const _ATTRACTIONS_UNUSED = {
      tolmin: {
        nameKey: 'attractions_place_tolmin',
        introKey: 'attractions_tolmin_intro',
        categories: [
          {
            categoryTitleKey: 'attractions_category_gorges',
            items: [
              {
                titleKey: 'attractions_tolmin_korita_title',
                teaserKey: 'attractions_tolmin_korita_teaser',
                detailsKey: 'attractions_tolmin_korita_details',
                timeKey: 'attractions_tolmin_korita_time',
                difficultyKey: 'attractions_tolmin_korita_difficulty',
                familyKey: 'attractions_tolmin_korita_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tolminska%20korita%2C%20Slovenia'
              },
              {
                titleKey: 'attractions_tolmin_medvedova_title',
                teaserKey: 'attractions_tolmin_medvedova_teaser',
                detailsKey: 'attractions_tolmin_medvedova_details',
                timeKey: 'attractions_tolmin_medvedova_time',
                difficultyKey: 'attractions_tolmin_medvedova_difficulty',
                familyKey: 'attractions_tolmin_medvedova_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Medvedova%20glava%20Tolminska%20korita%2C%20Slovenia'
              },
              {
                titleKey: 'attractions_tolmin_dantejeva_title',
                teaserKey: 'attractions_tolmin_dantejeva_teaser',
                detailsKey: 'attractions_tolmin_dantejeva_details',
                timeKey: 'attractions_tolmin_dantejeva_time',
                difficultyKey: 'attractions_tolmin_dantejeva_difficulty',
                familyKey: 'attractions_tolmin_dantejeva_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dantejeva%20jama%2C%20Slovenia'
              },
              {
                titleKey: 'attractions_tolmin_sotočje_title',
                teaserKey: 'attractions_tolmin_sotočje_teaser',
                detailsKey: 'attractions_tolmin_sotočje_details',
                timeKey: 'attractions_tolmin_sotočje_time',
                difficultyKey: 'attractions_tolmin_sotočje_difficulty',
                familyKey: 'attractions_tolmin_sotočje_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=So%C4%8Da%20Tolminka%20confluence%2C%20Tolmin%2C%20Slovenia'
              }
            ]
          },
          {
            categoryTitleKey: 'attractions_category_culture',
            items: [
              {
                titleKey: 'attractions_tolmin_javorca_title',
                teaserKey: 'attractions_tolmin_javorca_teaser',
                detailsKey: 'attractions_tolmin_javorca_details',
                timeKey: 'attractions_tolmin_javorca_time',
                difficultyKey: 'attractions_tolmin_javorca_difficulty',
                familyKey: 'attractions_tolmin_javorca_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Javorca%2C%20Slovenia'
              },
              {
                titleKey: 'attractions_tolmin_museum_title',
                teaserKey: 'attractions_tolmin_museum_teaser',
                detailsKey: 'attractions_tolmin_museum_details',
                timeKey: 'attractions_tolmin_museum_time',
                difficultyKey: 'attractions_tolmin_museum_difficulty',
                familyKey: 'attractions_tolmin_museum_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tolmin%20Museum%2C%20Slovenia'
              },
              {
                titleKey: 'attractions_tolmin_kozlov_title',
                teaserKey: 'attractions_tolmin_kozlov_teaser',
                detailsKey: 'attractions_tolmin_kozlov_details',
                timeKey: 'attractions_tolmin_kozlov_time',
                difficultyKey: 'attractions_tolmin_kozlov_difficulty',
                familyKey: 'attractions_tolmin_kozlov_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Kozlov%20rob%2C%20Tolmin%2C%20Slovenia'
              },
              {
                titleKey: 'attractions_tolmin_nemska_title',
                teaserKey: 'attractions_tolmin_nemska_teaser',
                detailsKey: 'attractions_tolmin_nemska_details',
                timeKey: 'attractions_tolmin_nemska_time',
                difficultyKey: 'attractions_tolmin_nemska_difficulty',
                familyKey: 'attractions_tolmin_nemska_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=German%20Charnel%20House%20Tolmin%2C%20Slovenia'
              }
            ]
          },
          {
            categoryTitleKey: 'attractions_category_rivers',
            items: [
              {
                titleKey: 'attractions_tolmin_tolminka_title',
                teaserKey: 'attractions_tolmin_tolminka_teaser',
                detailsKey: 'attractions_tolmin_tolminka_details',
                timeKey: 'attractions_tolmin_tolminka_time',
                difficultyKey: 'attractions_tolmin_tolminka_difficulty',
                familyKey: 'attractions_tolmin_tolminka_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tolminka%20river%20Tolmin%2C%20Slovenia'
              },
              {
                titleKey: 'attractions_tolmin_soca_access_title',
                teaserKey: 'attractions_tolmin_soca_access_teaser',
                detailsKey: 'attractions_tolmin_soca_access_details',
                timeKey: 'attractions_tolmin_soca_access_time',
                difficultyKey: 'attractions_tolmin_soca_access_difficulty',
                familyKey: 'attractions_tolmin_soca_access_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=So%C4%8Da%20river%20Tolmin%2C%20Slovenia'
              },
              {
                titleKey: 'attractions_tolmin_river_walks_title',
                teaserKey: 'attractions_tolmin_river_walks_teaser',
                detailsKey: 'attractions_tolmin_river_walks_details',
                timeKey: 'attractions_tolmin_river_walks_time',
                difficultyKey: 'attractions_tolmin_river_walks_difficulty',
                familyKey: 'attractions_tolmin_river_walks_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tolmin%20river%20walk%2C%20Slovenia'
              }
            ]
          },
          {
            categoryTitleKey: 'attractions_category_places',
            items: [
              {
                titleKey: 'attractions_tolmin_center_title',
                teaserKey: 'attractions_tolmin_center_teaser',
                detailsKey: 'attractions_tolmin_center_details',
                timeKey: 'attractions_tolmin_center_time',
                difficultyKey: 'attractions_tolmin_center_difficulty',
                familyKey: 'attractions_tolmin_center_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tolmin%20center%2C%20Slovenia'
              },
              {
                titleKey: 'attractions_tolmin_viewpoints_title',
                teaserKey: 'attractions_tolmin_viewpoints_teaser',
                detailsKey: 'attractions_tolmin_viewpoints_details',
                timeKey: 'attractions_tolmin_viewpoints_time',
                difficultyKey: 'attractions_tolmin_viewpoints_difficulty',
                familyKey: 'attractions_tolmin_viewpoints_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tolmin%20viewpoint%2C%20Slovenia'
              },
              {
                titleKey: 'attractions_tolmin_hiking_title',
                teaserKey: 'attractions_tolmin_hiking_teaser',
                detailsKey: 'attractions_tolmin_hiking_details',
                timeKey: 'attractions_tolmin_hiking_time',
                difficultyKey: 'attractions_tolmin_hiking_difficulty',
                familyKey: 'attractions_tolmin_hiking_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tolmin%20hiking%20trail%2C%20Slovenia'
              },
              {
                titleKey: 'attractions_tolmin_nature_reserve_title',
                teaserKey: 'attractions_tolmin_nature_reserve_teaser',
                detailsKey: 'attractions_tolmin_nature_reserve_details',
                timeKey: 'attractions_tolmin_nature_reserve_time',
                difficultyKey: 'attractions_tolmin_nature_reserve_difficulty',
                familyKey: 'attractions_tolmin_nature_reserve_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tolmin%20nature%20reserve%2C%20Slovenia'
              }
            ]
          }
        ]
      },
      most_na_soci: {
        nameKey: 'attractions_place_most_na_soci',
        introKey: 'attractions_most_na_soci_intro',
        categories: [
          {
            categoryTitleKey: 'attractions_category_lakes',
            items: [
              {
                titleKey: 'attractions_most_jezero_title',
                teaserKey: 'attractions_most_jezero_teaser',
                detailsKey: 'attractions_most_jezero_details',
                timeKey: 'attractions_most_jezero_time',
                difficultyKey: 'attractions_most_jezero_difficulty',
                familyKey: 'attractions_most_jezero_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Most%20na%20So%C4%8Di%20lake%2C%20Slovenia'
              },
              {
                titleKey: 'attractions_most_walkway_title',
                teaserKey: 'attractions_most_walkway_teaser',
                detailsKey: 'attractions_most_walkway_details',
                timeKey: 'attractions_most_walkway_time',
                difficultyKey: 'attractions_most_walkway_difficulty',
                familyKey: 'attractions_most_walkway_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Most%20na%20So%C4%8Di%20lake%20walk%2C%20Slovenia'
              }
            ]
          },
          {
            categoryTitleKey: 'attractions_category_rivers',
            items: [
              {
                titleKey: 'attractions_most_idrijca_title',
                teaserKey: 'attractions_most_idrijca_teaser',
                detailsKey: 'attractions_most_idrijca_details',
                timeKey: 'attractions_most_idrijca_time',
                difficultyKey: 'attractions_most_idrijca_difficulty',
                familyKey: 'attractions_most_idrijca_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Idrijca%20river%20Most%20na%20So%C4%8Di%2C%20Slovenia'
              },
              {
                titleKey: 'attractions_most_soca_access_title',
                teaserKey: 'attractions_most_soca_access_teaser',
                detailsKey: 'attractions_most_soca_access_details',
                timeKey: 'attractions_most_soca_access_time',
                difficultyKey: 'attractions_most_soca_access_difficulty',
                familyKey: 'attractions_most_soca_access_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=So%C4%8Da%20river%20Most%20na%20So%C4%8Di%2C%20Slovenia'
              }
            ]
          },
          {
            categoryTitleKey: 'attractions_category_culture',
            items: [
              {
                titleKey: 'attractions_most_center_title',
                teaserKey: 'attractions_most_center_teaser',
                detailsKey: 'attractions_most_center_details',
                timeKey: 'attractions_most_center_time',
                difficultyKey: 'attractions_most_center_difficulty',
                familyKey: 'attractions_most_center_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Most%20na%20So%C4%8Di%2C%20Slovenia'
              },
              {
                titleKey: 'attractions_most_station_title',
                teaserKey: 'attractions_most_station_teaser',
                detailsKey: 'attractions_most_station_details',
                timeKey: 'attractions_most_station_time',
                difficultyKey: 'attractions_most_station_difficulty',
                familyKey: 'attractions_most_station_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Most%20na%20So%C4%8Di%20train%20station%2C%20Slovenia'
              },
              {
                titleKey: 'attractions_most_archaeological_title',
                teaserKey: 'attractions_most_archaeological_teaser',
                detailsKey: 'attractions_most_archaeological_details',
                timeKey: 'attractions_most_archaeological_time',
                difficultyKey: 'attractions_most_archaeological_difficulty',
                familyKey: 'attractions_most_archaeological_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Archeological%20museum%20Most%20na%20So%C4%8Di%2C%20Slovenia'
              }
            ]
          }
        ]
      },
      kobarid: {
        nameKey: 'attractions_place_kobarid',
        introKey: 'attractions_kobarid_intro',
        categories: [
          {
            categoryTitleKey: 'attractions_category_waterfalls',
            items: [
              {
                titleKey: 'attractions_kobarid_kozjak_title',
                teaserKey: 'attractions_kobarid_kozjak_teaser',
                detailsKey: 'attractions_kobarid_kozjak_details',
                timeKey: 'attractions_kobarid_kozjak_time',
                difficultyKey: 'attractions_kobarid_kozjak_difficulty',
                familyKey: 'attractions_kobarid_kozjak_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Slap%20Kozjak%2C%20Slovenia'
              }
            ]
          },
          {
            categoryTitleKey: 'attractions_category_gorges',
            items: [
              {
                titleKey: 'attractions_kobarid_kosec_title',
                teaserKey: 'attractions_kobarid_kosec_teaser',
                detailsKey: 'attractions_kobarid_kosec_details',
                timeKey: 'attractions_kobarid_kosec_time',
                difficultyKey: 'attractions_kobarid_kosec_difficulty',
                familyKey: 'attractions_kobarid_kosec_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Kose%C4%8Dka%20korita%2C%20Slovenia'
              }
            ]
          },
          {
            categoryTitleKey: 'attractions_category_culture',
            items: [
              {
                titleKey: 'attractions_kobarid_museum_title',
                teaserKey: 'attractions_kobarid_museum_teaser',
                detailsKey: 'attractions_kobarid_museum_details',
                timeKey: 'attractions_kobarid_museum_time',
                difficultyKey: 'attractions_kobarid_museum_difficulty',
                familyKey: 'attractions_kobarid_museum_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Kobarid%20Museum%2C%20Slovenia'
              },
              {
                titleKey: 'attractions_kobarid_napoleonov_title',
                teaserKey: 'attractions_kobarid_napoleonov_teaser',
                detailsKey: 'attractions_kobarid_napoleonov_details',
                timeKey: 'attractions_kobarid_napoleonov_time',
                difficultyKey: 'attractions_kobarid_napoleonov_difficulty',
                familyKey: 'attractions_kobarid_napoleonov_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Napoleonov%20most%20Kobarid%2C%20Slovenia'
              },
              {
                titleKey: 'attractions_kobarid_tonovcov_title',
                teaserKey: 'attractions_kobarid_tonovcov_teaser',
                detailsKey: 'attractions_kobarid_tonovcov_details',
                timeKey: 'attractions_kobarid_tonovcov_time',
                difficultyKey: 'attractions_kobarid_tonovcov_difficulty',
                familyKey: 'attractions_kobarid_tonovcov_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tonovcov%20grad%2C%20Slovenia'
              },
              {
                titleKey: 'attractions_kobarid_italian_title',
                teaserKey: 'attractions_kobarid_italian_teaser',
                detailsKey: 'attractions_kobarid_italian_details',
                timeKey: 'attractions_kobarid_italian_time',
                difficultyKey: 'attractions_kobarid_italian_difficulty',
                familyKey: 'attractions_kobarid_italian_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Italian%20Charnel%20House%20Kobarid%2C%20Slovenia'
              },
              {
                titleKey: 'attractions_kobarid_ravelnik_title',
                teaserKey: 'attractions_kobarid_ravelnik_teaser',
                detailsKey: 'attractions_kobarid_ravelnik_details',
                timeKey: 'attractions_kobarid_ravelnik_time',
                difficultyKey: 'attractions_kobarid_ravelnik_difficulty',
                familyKey: 'attractions_kobarid_ravelnik_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Ravelnik%20open-air%20museum%2C%20Slovenia'
              }
            ]
          },
          {
            categoryTitleKey: 'attractions_category_rivers',
            items: [
              {
                titleKey: 'attractions_kobarid_nadiza_title',
                teaserKey: 'attractions_kobarid_nadiza_teaser',
                detailsKey: 'attractions_kobarid_nadiza_details',
                timeKey: 'attractions_kobarid_nadiza_time',
                difficultyKey: 'attractions_kobarid_nadiza_difficulty',
                familyKey: 'attractions_kobarid_nadiza_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Nadi%C5%BEa%20river%2C%20Slovenia'
              },
              {
                titleKey: 'attractions_kobarid_soca_access_title',
                teaserKey: 'attractions_kobarid_soca_access_teaser',
                detailsKey: 'attractions_kobarid_soca_access_details',
                timeKey: 'attractions_kobarid_soca_access_time',
                difficultyKey: 'attractions_kobarid_soca_access_difficulty',
                familyKey: 'attractions_kobarid_soca_access_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=So%C4%8Da%20river%20Kobarid%2C%20Slovenia'
              }
            ]
          },
          {
            categoryTitleKey: 'attractions_category_places',
            items: [
              {
                titleKey: 'attractions_kobarid_krn_title',
                teaserKey: 'attractions_kobarid_krn_teaser',
                detailsKey: 'attractions_kobarid_krn_details',
                timeKey: 'attractions_kobarid_krn_time',
                difficultyKey: 'attractions_kobarid_krn_difficulty',
                familyKey: 'attractions_kobarid_krn_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Krn%20mountain%20Slovenia%20Kobarid'
              },
              {
                titleKey: 'attractions_kobarid_center_title',
                teaserKey: 'attractions_kobarid_center_teaser',
                detailsKey: 'attractions_kobarid_center_details',
                timeKey: 'attractions_kobarid_center_time',
                difficultyKey: 'attractions_kobarid_center_difficulty',
                familyKey: 'attractions_kobarid_center_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Kobarid%20center%2C%20Slovenia'
              }
            ]
          }
        ]
      },
      srpenica: {
        nameKey: 'attractions_place_srpenica',
        introKey: 'attractions_srpenica_intro',
        categories: [
          {
            categoryTitleKey: 'attractions_category_places',
            items: [
              {
                titleKey: 'attractions_srpenica_place_title',
                teaserKey: 'attractions_srpenica_place_teaser',
                detailsKey: 'attractions_srpenica_place_details',
                timeKey: 'attractions_srpenica_place_time',
                difficultyKey: 'attractions_srpenica_place_difficulty',
                familyKey: 'attractions_srpenica_place_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Srpenica%2C%20Slovenia'
              }
            ]
          },
          {
            categoryTitleKey: 'attractions_category_rivers',
            items: [
              {
                titleKey: 'attractions_srpenica_soca_title',
                teaserKey: 'attractions_srpenica_soca_teaser',
                detailsKey: 'attractions_srpenica_soca_details',
                timeKey: 'attractions_srpenica_soca_time',
                difficultyKey: 'attractions_srpenica_soca_difficulty',
                familyKey: 'attractions_srpenica_soca_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=So%C4%8Da%20river%20Srpenica%2C%20Slovenia'
              },
              {
                titleKey: 'attractions_srpenica_koritnica_title',
                teaserKey: 'attractions_srpenica_koritnica_teaser',
                detailsKey: 'attractions_srpenica_koritnica_details',
                timeKey: 'attractions_srpenica_koritnica_time',
                difficultyKey: 'attractions_srpenica_koritnica_difficulty',
                familyKey: 'attractions_srpenica_koritnica_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Koritnica%20river%20Srpenica%2C%20Slovenia'
              }
            ]
          },
          {
            categoryTitleKey: 'attractions_category_culture',
            items: [
              {
                titleKey: 'attractions_srpenica_wwi_title',
                teaserKey: 'attractions_srpenica_wwi_teaser',
                detailsKey: 'attractions_srpenica_wwi_details',
                timeKey: 'attractions_srpenica_wwi_time',
                difficultyKey: 'attractions_srpenica_wwi_difficulty',
                familyKey: 'attractions_srpenica_wwi_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Srpenica%20WWI%20sites%2C%20Slovenia'
              }
            ]
          }
        ]
      },
      zaga: {
        nameKey: 'attractions_place_zaga',
        introKey: 'attractions_zaga_intro',
        categories: [
          {
            categoryTitleKey: 'attractions_category_waterfalls',
            items: [
              {
                titleKey: 'attractions_zaga_boka_title',
                teaserKey: 'attractions_zaga_boka_teaser',
                detailsKey: 'attractions_zaga_boka_details',
                timeKey: 'attractions_zaga_boka_time',
                difficultyKey: 'attractions_zaga_boka_difficulty',
                familyKey: 'attractions_zaga_boka_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Slap%20Boka%2C%20Slovenia'
              }
            ]
          },
          {
            categoryTitleKey: 'attractions_category_gorges',
            items: [
              {
                titleKey: 'attractions_zaga_koritnica_title',
                teaserKey: 'attractions_zaga_koritnica_teaser',
                detailsKey: 'attractions_zaga_koritnica_details',
                timeKey: 'attractions_zaga_koritnica_time',
                difficultyKey: 'attractions_zaga_koritnica_difficulty',
                familyKey: 'attractions_zaga_koritnica_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Koritnica%20gorge%2C%20Slovenia'
              }
            ]
          },
          {
            categoryTitleKey: 'attractions_category_places',
            items: [
              {
                titleKey: 'attractions_zaga_place_title',
                teaserKey: 'attractions_zaga_place_teaser',
                detailsKey: 'attractions_zaga_place_details',
                timeKey: 'attractions_zaga_place_time',
                difficultyKey: 'attractions_zaga_place_difficulty',
                familyKey: 'attractions_zaga_place_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=%C5%BDaga%2C%20Slovenia'
              },
              {
                titleKey: 'attractions_zaga_viewpoints_title',
                teaserKey: 'attractions_zaga_viewpoints_teaser',
                detailsKey: 'attractions_zaga_viewpoints_details',
                timeKey: 'attractions_zaga_viewpoints_time',
                difficultyKey: 'attractions_zaga_viewpoints_difficulty',
                familyKey: 'attractions_zaga_viewpoints_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=So%C4%8Da%20viewpoint%20%C5%BDaga%2C%20Slovenia'
              }
            ]
          }
        ]
      },
      cezsoča: {
        nameKey: 'attractions_place_cezsoča',
        introKey: 'attractions_cezsoča_intro',
        categories: [
          {
            categoryTitleKey: 'attractions_category_places',
            items: [
              {
                titleKey: 'attractions_cezsoča_place_title',
                teaserKey: 'attractions_cezsoča_place_teaser',
                detailsKey: 'attractions_cezsoča_place_details',
                timeKey: 'attractions_cezsoča_place_time',
                difficultyKey: 'attractions_cezsoča_place_difficulty',
                familyKey: 'attractions_cezsoča_place_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=%C4%8Cezso%C4%8Da%2C%20Slovenia'
              },
              {
                titleKey: 'attractions_cezsoča_vodenca_title',
                teaserKey: 'attractions_cezsoča_vodenca_teaser',
                detailsKey: 'attractions_cezsoča_vodenca_details',
                timeKey: 'attractions_cezsoča_vodenca_time',
                difficultyKey: 'attractions_cezsoča_vodenca_difficulty',
                familyKey: 'attractions_cezsoča_vodenca_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Vodenca%2C%20Slovenia'
              },
              {
                titleKey: 'attractions_cezsoča_viewpoints_title',
                teaserKey: 'attractions_cezsoča_viewpoints_teaser',
                detailsKey: 'attractions_cezsoča_viewpoints_details',
                timeKey: 'attractions_cezsoča_viewpoints_time',
                difficultyKey: 'attractions_cezsoča_viewpoints_difficulty',
                familyKey: 'attractions_cezsoča_viewpoints_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=%C4%8Cezso%C4%8Da%20viewpoint%2C%20Slovenia'
              }
            ]
          },
          {
            categoryTitleKey: 'attractions_category_rivers',
            items: [
              {
                titleKey: 'attractions_cezsoča_soca_title',
                teaserKey: 'attractions_cezsoča_soca_teaser',
                detailsKey: 'attractions_cezsoča_soca_details',
                timeKey: 'attractions_cezsoča_soca_time',
                difficultyKey: 'attractions_cezsoča_soca_difficulty',
                familyKey: 'attractions_cezsoča_soca_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=So%C4%8Da%20river%20%C4%8Cezso%C4%8Da%2C%20Slovenia'
              }
            ]
          }
        ]
      },
      bovec: {
        nameKey: 'attractions_place_bovec',
        introKey: 'attractions_bovec_intro',
        categories: [
          {
            categoryTitleKey: 'attractions_category_places',
            items: [
              {
                titleKey: 'attractions_bovec_center_title',
                teaserKey: 'attractions_bovec_center_teaser',
                detailsKey: 'attractions_bovec_center_details',
                timeKey: 'attractions_bovec_center_time',
                difficultyKey: 'attractions_bovec_center_difficulty',
                familyKey: 'attractions_bovec_center_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Bovec%2C%20Slovenia'
              }
            ]
          },
          {
            categoryTitleKey: 'attractions_category_waterfalls',
            items: [
              {
                titleKey: 'attractions_bovec_virje_title',
                teaserKey: 'attractions_bovec_virje_teaser',
                detailsKey: 'attractions_bovec_virje_details',
                timeKey: 'attractions_bovec_virje_time',
                difficultyKey: 'attractions_bovec_virje_difficulty',
                familyKey: 'attractions_bovec_virje_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Slap%20Virje%2C%20Slovenia'
              },
              {
                titleKey: 'attractions_bovec_boka_title',
                teaserKey: 'attractions_bovec_boka_teaser',
                detailsKey: 'attractions_bovec_boka_details',
                timeKey: 'attractions_bovec_boka_time',
                difficultyKey: 'attractions_bovec_boka_difficulty',
                familyKey: 'attractions_bovec_boka_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Slap%20Boka%2C%20Slovenia'
              }
            ]
          },
          {
            categoryTitleKey: 'attractions_category_gorges',
            items: [
              {
                titleKey: 'attractions_bovec_velika_korita_title',
                teaserKey: 'attractions_bovec_velika_korita_teaser',
                detailsKey: 'attractions_bovec_velika_korita_details',
                timeKey: 'attractions_bovec_velika_korita_time',
                difficultyKey: 'attractions_bovec_velika_korita_difficulty',
                familyKey: 'attractions_bovec_velika_korita_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Velika%20korita%20So%C4%8De%2C%20Slovenia'
              },
              {
                titleKey: 'attractions_bovec_mala_korita_title',
                teaserKey: 'attractions_bovec_mala_korita_teaser',
                detailsKey: 'attractions_bovec_mala_korita_details',
                timeKey: 'attractions_bovec_mala_korita_time',
                difficultyKey: 'attractions_bovec_mala_korita_difficulty',
                familyKey: 'attractions_bovec_mala_korita_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Mala%20korita%20So%C4%8De%2C%20Slovenia'
              }
            ]
          },
          {
            categoryTitleKey: 'attractions_category_culture',
            items: [
              {
                titleKey: 'attractions_bovec_kluze_title',
                teaserKey: 'attractions_bovec_kluze_teaser',
                detailsKey: 'attractions_bovec_kluze_details',
                timeKey: 'attractions_bovec_kluze_time',
                difficultyKey: 'attractions_bovec_kluze_difficulty',
                familyKey: 'attractions_bovec_kluze_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Klu%C5%BEe%20Fortress%2C%20Slovenia'
              },
              {
                titleKey: 'attractions_bovec_hermann_title',
                teaserKey: 'attractions_bovec_hermann_teaser',
                detailsKey: 'attractions_bovec_hermann_details',
                timeKey: 'attractions_bovec_hermann_time',
                difficultyKey: 'attractions_bovec_hermann_difficulty',
                familyKey: 'attractions_bovec_hermann_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Fort%20Hermann%2C%20Slovenia'
              }
            ]
          },
          {
            categoryTitleKey: 'attractions_category_valleys',
            items: [
              {
                titleKey: 'attractions_bovec_kanin_title',
                teaserKey: 'attractions_bovec_kanin_teaser',
                detailsKey: 'attractions_bovec_kanin_details',
                timeKey: 'attractions_bovec_kanin_time',
                difficultyKey: 'attractions_bovec_kanin_difficulty',
                familyKey: 'attractions_bovec_kanin_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Kanin%20Bovec%2C%20Slovenia'
              },
              {
                titleKey: 'attractions_bovec_mangart_title',
                teaserKey: 'attractions_bovec_mangart_teaser',
                detailsKey: 'attractions_bovec_mangart_details',
                timeKey: 'attractions_bovec_mangart_time',
                difficultyKey: 'attractions_bovec_mangart_difficulty',
                familyKey: 'attractions_bovec_mangart_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Mangartsko%20sedlo%2C%20Slovenia'
              }
            ]
          }
        ]
      },
      trenta: {
        nameKey: 'attractions_place_trenta',
        introKey: 'attractions_trenta_intro',
        categories: [
          {
            categoryTitleKey: 'attractions_category_valleys',
            items: [
              {
                titleKey: 'attractions_trenta_valley_title',
                teaserKey: 'attractions_trenta_valley_teaser',
                detailsKey: 'attractions_trenta_valley_details',
                timeKey: 'attractions_trenta_valley_time',
                difficultyKey: 'attractions_trenta_valley_difficulty',
                familyKey: 'attractions_trenta_valley_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Trenta%20Valley%2C%20Slovenia'
              },
              {
                titleKey: 'attractions_trenta_izvir_title',
                teaserKey: 'attractions_trenta_izvir_teaser',
                detailsKey: 'attractions_trenta_izvir_details',
                timeKey: 'attractions_trenta_izvir_time',
                difficultyKey: 'attractions_trenta_izvir_difficulty',
                familyKey: 'attractions_trenta_izvir_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Izvir%20So%C4%8De%2C%20Trenta%2C%20Slovenia'
              },
              {
                titleKey: 'attractions_trenta_zadnjica_title',
                teaserKey: 'attractions_trenta_zadnjica_teaser',
                detailsKey: 'attractions_trenta_zadnjica_details',
                timeKey: 'attractions_trenta_zadnjica_time',
                difficultyKey: 'attractions_trenta_zadnjica_difficulty',
                familyKey: 'attractions_trenta_zadnjica_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Zadnjica%20Valley%2C%20Slovenia'
              }
            ]
          },
          {
            categoryTitleKey: 'attractions_category_culture',
            items: [
              {
                titleKey: 'attractions_trenta_dom_title',
                teaserKey: 'attractions_trenta_dom_teaser',
                detailsKey: 'attractions_trenta_dom_details',
                timeKey: 'attractions_trenta_dom_time',
                difficultyKey: 'attractions_trenta_dom_difficulty',
                familyKey: 'attractions_trenta_dom_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dom%20Trenta%2C%20Slovenia'
              }
            ]
          },
          {
            categoryTitleKey: 'attractions_category_places',
            items: [
              {
                titleKey: 'attractions_trenta_trail_title',
                teaserKey: 'attractions_trenta_trail_teaser',
                detailsKey: 'attractions_trenta_trail_details',
                timeKey: 'attractions_trenta_trail_time',
                difficultyKey: 'attractions_trenta_trail_difficulty',
                familyKey: 'attractions_trenta_trail_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=So%C4%8Da%20Trail%20Trenta%2C%20Slovenia'
              }
            ]
          }
        ]
      },
      lepena: {
        nameKey: 'attractions_place_lepena',
        introKey: 'attractions_lepena_intro',
        categories: [
          {
            categoryTitleKey: 'attractions_category_valleys',
            items: [
              {
                titleKey: 'attractions_lepena_valley_title',
                teaserKey: 'attractions_lepena_valley_teaser',
                detailsKey: 'attractions_lepena_valley_details',
                timeKey: 'attractions_lepena_valley_time',
                difficultyKey: 'attractions_lepena_valley_difficulty',
                familyKey: 'attractions_lepena_valley_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Lepena%20Valley%2C%20Slovenia'
              },
              {
                titleKey: 'attractions_lepena_sunikov_title',
                teaserKey: 'attractions_lepena_sunikov_teaser',
                detailsKey: 'attractions_lepena_sunikov_details',
                timeKey: 'attractions_lepena_sunikov_time',
                difficultyKey: 'attractions_lepena_sunikov_difficulty',
                familyKey: 'attractions_lepena_sunikov_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=%C5%A0unikov%20vodni%20gaj%2C%20Lepena%2C%20Slovenia'
              }
            ]
          },
          {
            categoryTitleKey: 'attractions_category_rivers',
            items: [
              {
                titleKey: 'attractions_lepena_lepenjica_title',
                teaserKey: 'attractions_lepena_lepenjica_teaser',
                detailsKey: 'attractions_lepena_lepenjica_details',
                timeKey: 'attractions_lepena_lepenjica_time',
                difficultyKey: 'attractions_lepena_lepenjica_difficulty',
                familyKey: 'attractions_lepena_lepenjica_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Lepenjica%20stream%2C%20Lepena%2C%20Slovenia'
              }
            ]
          },
          {
            categoryTitleKey: 'attractions_category_places',
            items: [
              {
                titleKey: 'attractions_lepena_walk_title',
                teaserKey: 'attractions_lepena_walk_teaser',
                detailsKey: 'attractions_lepena_walk_details',
                timeKey: 'attractions_lepena_walk_time',
                difficultyKey: 'attractions_lepena_walk_difficulty',
                familyKey: 'attractions_lepena_walk_family',
                mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Lepena%20hiking%20trail%2C%20Slovenia'
              }
            ]
          }
        ]
    */

    function showAttractionsScreen() {
      const screen = document.getElementById('attractions-screen');
      if (screen) {
        screen.classList.add('show');
        renderAttractionsContent();
        history.pushState({ overlay: 'attractions' }, '', window.location.pathname + window.location.search + (window.location.hash || ''));
      }
    }
    
    function hideAttractionsScreen() {
      const screen = document.getElementById('attractions-screen');
      if (screen) {
        screen.classList.remove('show');
      }
    }
    
    function renderAttractionsContent() {
      const body = document.getElementById('attractions-body');
      if (!body || !translations[currentLang]) return;
      
      const trans = translations[currentLang];
      
      // Get selected place from localStorage, default to 'bovec'
      const selectedPlace = localStorage.getItem('attractions_place') || 'bovec';
      
      // Place selector
      const places = ['tolmin', 'most_na_soci', 'kobarid', 'srpenica', 'zaga', 'cezsoča', 'bovec', 'trenta', 'lepena'];
      
      // Get selected place name
      const selectedPlaceData = ATTRACTIONS[selectedPlace];
      const selectedPlaceName = selectedPlaceData ? (trans[selectedPlaceData.nameKey] || selectedPlace) : selectedPlace;
      
      let html = `<div class="attractions-intro">${trans.attractions_intro || ''}</div>`;
      
      // Show selected location header
      html += `<div class="attractions-selected-header">
        <span class="attractions-selected-label">${trans.attractions_selected || 'Selected'}:</span>
        <span class="attractions-selected-value">${selectedPlaceName}</span>
      </div>`;
      
      // Dropdown selector
      html += '<div class="attractions-place-selector-dropdown">';
      html += `<select id="attractions-place-select" class="attractions-place-select">`;
      places.forEach(placeId => {
        const placeData = ATTRACTIONS[placeId];
        if (!placeData) return;
        const placeName = trans[placeData.nameKey] || placeId;
        const isSelected = placeId === selectedPlace;
        html += `<option value="${placeId}" ${isSelected ? 'selected' : ''}>${placeName}</option>`;
      });
      html += '</select>';
      html += '</div>';
      
      // Also add button chips for better visibility
      html += '<div class="attractions-place-selector">';
      places.forEach(placeId => {
        const placeData = ATTRACTIONS[placeId];
        if (!placeData) return;
        const placeName = trans[placeData.nameKey] || placeId;
        const isSelected = placeId === selectedPlace;
        html += `<button class="attractions-place-chip ${isSelected ? 'active' : ''}" data-place="${placeId}" type="button">${placeName}</button>`;
      });
      html += '</div>';
      
      // Get selected place data
      const placeData = ATTRACTIONS[selectedPlace];
      if (!placeData) return;
      
      const placeIntro = trans[placeData.introKey] || '';
      if (placeIntro) {
        html += `<div class="attractions-place-intro">${placeIntro}</div>`;
      }
      
      // Categories accordion
      html += '<div class="attractions-categories">';
      placeData.categories.forEach((category, catIndex) => {
        const categoryTitle = trans[category.categoryTitleKey] || '';
        html += `
          <div class="attractions-category">
            <button class="attractions-category-header" data-category="${catIndex}" type="button">
              <span>${categoryTitle}</span>
              <span class="attractions-category-icon">▼</span>
            </button>
            <div class="attractions-category-content" id="attractions-category-${catIndex}">
        `;
        
        // Attraction cards
        category.items.forEach((item, itemIndex) => {
          const title = trans[item.titleKey] || '';
          const teaser = trans[item.teaserKey] || '';
          const details = trans[item.detailsKey] || '';
          const time = trans[item.timeKey] || '';
          const difficultyKey = item.difficultyKey;
          const difficultyText = trans[difficultyKey] || difficultyKey;
          const familyKey = item.familyKey;
          const familyText = trans[familyKey] || familyKey;
          
          html += `
            <div class="attractions-card">
              <h3 class="attractions-card-title">${title}</h3>
              <p class="attractions-card-teaser">${teaser}</p>
              <div class="attractions-card-facts">
                <span class="attractions-fact"><span class="attractions-fact-label">${trans.attractions_time || 'Time'}:</span> ${time}</span>
                <span class="attractions-fact"><span class="attractions-fact-label">${trans.attractions_difficulty || 'Difficulty'}:</span> ${difficultyText}</span>
                <span class="attractions-fact"><span class="attractions-fact-label">${trans.attractions_family || 'Family'}:</span> ${familyText}</span>
              </div>
              <a href="${item.mapsUrl}" target="_blank" class="attractions-maps-btn">${trans.attractions_open_maps || 'Open in Maps'}</a>
              <div class="attractions-card-details" id="attractions-details-${catIndex}-${itemIndex}" style="display: none;">
                <div class="attractions-card-details-content">${details}</div>
              </div>
              <button class="attractions-read-more-btn" data-details="${catIndex}-${itemIndex}" type="button">
                <span class="attractions-read-more-text">${trans.attractions_read_more || 'Read more'}</span>
                <span class="attractions-read-more-text-less" style="display: none;">${trans.attractions_show_less || 'Show less'}</span>
              </button>
            </div>
          `;
        });
        
        html += `
            </div>
          </div>
        `;
      });
      html += '</div>';
      
      body.innerHTML = html;
      
      // Place selector dropdown handler
      const placeSelect = body.querySelector('#attractions-place-select');
      if (placeSelect) {
        placeSelect.addEventListener('change', () => {
          const placeId = placeSelect.value;
          localStorage.setItem('attractions_place', placeId);
          renderAttractionsContent(); // Re-render with new place
          // Update trip ideas if screen is open
          const tripIdeasScreen = document.getElementById('trip-ideas-screen');
          if (tripIdeasScreen && tripIdeasScreen.classList.contains('show')) {
            renderTripIdeasContent(placeId);
          }
        });
      }
      
      // Place selector button chips handler
      body.querySelectorAll('.attractions-place-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const placeId = chip.getAttribute('data-place');
          localStorage.setItem('attractions_place', placeId);
          renderAttractionsContent(); // Re-render with new place
          // Update trip ideas if screen is open
          const tripIdeasScreen = document.getElementById('trip-ideas-screen');
          if (tripIdeasScreen && tripIdeasScreen.classList.contains('show')) {
            renderTripIdeasContent(placeId);
          }
        });
      });
      
      // Category accordion handlers
      body.querySelectorAll('.attractions-category-header').forEach(header => {
        header.addEventListener('click', () => {
          const catIndex = header.getAttribute('data-category');
          const content = document.getElementById(`attractions-category-${catIndex}`);
          const icon = header.querySelector('.attractions-category-icon');
          const isOpen = content.classList.contains('open');
          
          if (isOpen) {
            content.classList.remove('open');
            icon.textContent = '▼';
          } else {
            content.classList.add('open');
            icon.textContent = '▲';
          }
        });
      });
      
      // Read more handlers
      body.querySelectorAll('.attractions-read-more-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const detailsId = btn.getAttribute('data-details');
          const detailsDiv = document.getElementById(`attractions-details-${detailsId}`);
          const readMoreText = btn.querySelector('.attractions-read-more-text');
          const readLessText = btn.querySelector('.attractions-read-more-text-less');
          
          if (detailsDiv.style.display === 'none') {
            detailsDiv.style.display = 'block';
            readMoreText.style.display = 'none';
            readLessText.style.display = 'inline';
          } else {
            detailsDiv.style.display = 'none';
            readMoreText.style.display = 'inline';
            readLessText.style.display = 'none';
          }
        });
      });
    }
    
    function openAttractions() {
      closeAllPanels();
      showAttractionsScreen();
    }
    
    function closeAttractions() {
      hideAttractionsScreen();
      window.APP.utils.scrollToTopReliable();
    }

    // Trip Ideas screen functions
    function showTripIdeasScreen(place) {
      const screen = document.getElementById('trip-ideas-screen');
      if (screen) {
        screen.classList.add('show');
        renderTripIdeasContent(place);
        history.pushState({ overlay: 'trip-ideas' }, '', window.location.pathname + window.location.search + (window.location.hash || ''));
      }
    }
    
    function hideTripIdeasScreen() {
      const screen = document.getElementById('trip-ideas-screen');
      if (screen) {
        screen.classList.remove('show');
      }
    }
    
    function openTripIdeas(place) {
          closeAllPanels();
      const selectedPlace = place || getTripIdeasPlace();
      showTripIdeasScreen(selectedPlace);
    }
    
    function closeTripIdeas() {
      hideTripIdeasScreen();
      window.APP.utils.scrollToTopReliable();
      // Clear URL hash
      if (window.location.hash.includes('trip-ideas')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
    
    function getTripIdeasPlace() {
      // Check URL param first
      const urlParams = new URLSearchParams(window.location.search);
      const placeParam = urlParams.get('place');
      if (placeParam && tripIdeasPlaces.includes(placeParam)) {
        localStorage.setItem('tripIdeas_lastPlace', placeParam);
        return placeParam;
      }
      
      // Check hash
      const hash = window.location.hash;
      if (hash.includes('trip-ideas')) {
        const hashMatch = hash.match(/place=([^&]+)/);
        if (hashMatch && tripIdeasPlaces.includes(hashMatch[1])) {
          localStorage.setItem('tripIdeas_lastPlace', hashMatch[1]);
          return hashMatch[1];
        }
      }
      
      // Check localStorage
      const saved = localStorage.getItem('tripIdeas_lastPlace');
      if (saved && tripIdeasPlaces.includes(saved)) {
        return saved;
      }
      
      // Default to first place
      return tripIdeasPlaces[0];
    }
    
    function renderTripIdeasContent(place) {
      const body = document.getElementById('trip-ideas-body');
      if (!body) return;
      
      const trans = translations[currentLang];
      const placeData = tripIdeasData[place];
      if (!placeData || !trans) return;
      
      const placeNames = {
        tolmin: { sl: 'Tolmin', en: 'Tolmin', de: 'Tolmin', it: 'Tolmin' },
        kobarid: { sl: 'Kobarid', en: 'Kobarid', de: 'Kobarid', it: 'Kobarid' },
        srpenica: { sl: 'Srpenica', en: 'Srpenica', de: 'Srpenica', it: 'Srpenica' },
        zaga: { sl: 'Žaga', en: 'Žaga', de: 'Žaga', it: 'Žaga' },
        bovec: { sl: 'Bovec', en: 'Bovec', de: 'Bovec', it: 'Bovec' },
        cezsoča: { sl: 'Čezsoča', en: 'Čezsoča', de: 'Čezsoča', it: 'Čezsoča' },
        vodenca: { sl: 'Vodenca', en: 'Vodenca', de: 'Vodenca', it: 'Vodenca' }
      };
      
      let html = `<div style="padding: 1rem;">`;
      
      // Intro text
      html += `<p style="margin-bottom: 1.5rem; color: var(--text-secondary); font-size: 0.9375rem; line-height: 1.6;">${trans.trip_ideas_intro || ''}</p>`;
      
      // Place selector
      html += `<div class="place-selector">`;
      tripIdeasPlaces.forEach(p => {
        const isSelected = p === place;
        const name = placeNames[p]?.[currentLang] || p;
        html += `<div class="place-card ${isSelected ? 'selected' : ''}" data-place="${p}">
          <div class="place-card-title">${name}</div>
        </div>`;
      });
      html += `</div>`;
      
      // Change place button (if not showing selector)
      html += `<button class="btn btn-secondary change-place-btn" id="change-place-btn" style="width: 100%; margin-bottom: 1.5rem;">${trans.trip_ideas_change_place || ''}</button>`;
      
      // Content sections
      const sections = [
        { key: 'overview', titleKey: 'trip_ideas_overview' },
        { key: 'short', titleKey: 'trip_ideas_short' },
        { key: 'half', titleKey: 'trip_ideas_half' },
        { key: 'full', titleKey: 'trip_ideas_full' },
        { key: 'kids', titleKey: 'trip_ideas_kids' },
        { key: 'rain', titleKey: 'trip_ideas_rain' },
        { key: 'tips', titleKey: 'trip_ideas_tips' }
      ];
      
      sections.forEach(section => {
        const contentKey = placeData[section.key + 'Key'];
        const content = trans[contentKey];
        if (content) {
          html += `<div class="trip-section">
            <h3 class="trip-section-title">${trans[section.titleKey] || ''}</h3>
            <div class="trip-section-content">${content}</div>
          </div>`;
        }
      });
      
      html += `</div>`;
      
      body.innerHTML = html;
      
      // Add event listeners
      document.querySelectorAll('.place-card').forEach(card => {
        card.addEventListener('click', () => {
          const newPlace = card.getAttribute('data-place');
          if (newPlace && newPlace !== place) {
            // Sync with attractions selection
            localStorage.setItem('attractions_place', newPlace);
            renderTripIdeasContent(newPlace);
            // Update URL
            window.history.replaceState(null, '', `${window.location.pathname}#trip-ideas?place=${newPlace}`);
          }
        });
      });
      
      const changePlaceBtn = document.getElementById('change-place-btn');
      if (changePlaceBtn) {
        changePlaceBtn.addEventListener('click', () => {
          const selector = document.querySelector('.place-selector');
          if (selector) {
            selector.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      }
    }
    
    // Handle URL hash on load
    function handleTripIdeasHash() {
      const hash = window.location.hash;
      if (hash.includes('trip-ideas')) {
        const place = getTripIdeasPlace();
        openTripIdeas(place);
      }
    }

    // Weather Widget - Real Weather Implementation
    const WEATHER_CACHE_KEY = 'weatherLocationCache';
    const WEATHER_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours
    const WEATHER_REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes
    
    // Default coordinates (Bovec, Slovenia)
    const DEFAULT_COORDS = { lat: 46.3378, lon: 13.5528, city: 'Bovec' };
    
    // Get effective coordinates (from cache or geolocation or default)
    async function getEffectiveCoords() {
      // Check cache first
      try {
        const cached = localStorage.getItem(WEATHER_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          const lat = parseFloat(parsed.lat);
          const lon = parseFloat(parsed.lon);
          if (Date.now() - (parsed.timestamp || 0) < WEATHER_CACHE_TTL && !isNaN(lat) && !isNaN(lon)) {
            return { lat, lon, city: parsed.city || DEFAULT_COORDS.city };
          }
        }
      } catch (e) {
        // Cache invalid, continue
      }
      
      // Use selected location (Bovec) only; no geolocation so temp matches displayed location
      
      // Cache default so next load is fast
      try {
        localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({
          lat: DEFAULT_COORDS.lat,
          lon: DEFAULT_COORDS.lon,
          city: DEFAULT_COORDS.city,
          timestamp: Date.now()
        }));
      } catch (e) {}
      return DEFAULT_COORDS;
    }
    
    // Fetch weather from Open-Meteo
    async function fetchOpenMeteoWeather(lat, lon) {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error('Weather API failed');
        
        const data = await response.json();
        if (data.current) {
          let moonPhase = null;
          if (data.daily && data.daily.moon_phase && data.daily.moon_phase[0] != null) {
            moonPhase = data.daily.moon_phase[0];
          }
          return {
            temp: Math.round(data.current.temperature_2m),
            code: data.current.weather_code,
            moonPhase: moonPhase
          };
        }
      } catch (error) {
        console.error('Weather fetch error:', error);
      }
      return null;
    }
    
    // Reverse geocoding (koordinate → ime mesta) – BigDataCloud (CORS, brez ključa)
    async function fetchReverseGeocode(lat, lon) {
      try {
        const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=${currentLang}`;
        const response = await fetch(url);
        if (!response.ok) return null;
        const data = await response.json();
        return data.locality || data.city || data.principalSubdivision || null;
      } catch (error) {
        // Uporabi privzeto ime
      }
      return null;
    }
    
    // Map WMO weather code to icon and localized text
    function weatherCodeToIconAndText(code, lang) {
      // WMO Weather interpretation codes (WW)
      // 0: Clear sky, 1-3: Mainly clear/partly cloudy/overcast
      // 45-48: Fog, 51-67: Drizzle/Rain, 71-77: Snow, 80-99: Rain/Snow showers/Thunderstorm
      
      const codeMap = {
        sl: {
          0: { icon: '☀️', text: 'Jasno' },
          1: { icon: '☀️', text: 'Pretežno jasno' },
          2: { icon: '⛅', text: 'Delno oblačno' },
          3: { icon: '☁️', text: 'Oblačno' },
          45: { icon: '🌫️', text: 'Megla' },
          48: { icon: '🌫️', text: 'Megla' },
          51: { icon: '🌦️', text: 'Rosilo' },
          53: { icon: '🌦️', text: 'Rosilo' },
          55: { icon: '🌦️', text: 'Rosilo' },
          56: { icon: '🌦️', text: 'Zmrzalno rosilo' },
          57: { icon: '🌦️', text: 'Zmrzalno rosilo' },
          61: { icon: '🌧️', text: 'Dež' },
          63: { icon: '🌧️', text: 'Dež' },
          65: { icon: '🌧️', text: 'Močan dež' },
          66: { icon: '🌧️', text: 'Zmrzalni dež' },
          67: { icon: '🌧️', text: 'Zmrzalni dež' },
          71: { icon: '❄️', text: 'Sneg' },
          73: { icon: '❄️', text: 'Sneg' },
          75: { icon: '❄️', text: 'Močan sneg' },
          77: { icon: '❄️', text: 'Snežne zrnice' },
          80: { icon: '🌧️', text: 'Deževni nalivi' },
          81: { icon: '🌧️', text: 'Deževni nalivi' },
          82: { icon: '🌧️', text: 'Močni deževni nalivi' },
          85: { icon: '❄️', text: 'Snežni nalivi' },
          86: { icon: '❄️', text: 'Močni snežni nalivi' },
          95: { icon: '⛈️', text: 'Nevihta' },
          96: { icon: '⛈️', text: 'Nevihta s točo' },
          99: { icon: '⛈️', text: 'Nevihta s točo' }
        },
        en: {
          0: { icon: '☀️', text: 'Clear' },
          1: { icon: '☀️', text: 'Mainly clear' },
          2: { icon: '⛅', text: 'Partly cloudy' },
          3: { icon: '☁️', text: 'Overcast' },
          45: { icon: '🌫️', text: 'Fog' },
          48: { icon: '🌫️', text: 'Fog' },
          51: { icon: '🌦️', text: 'Drizzle' },
          53: { icon: '🌦️', text: 'Drizzle' },
          55: { icon: '🌦️', text: 'Drizzle' },
          56: { icon: '🌦️', text: 'Freezing drizzle' },
          57: { icon: '🌦️', text: 'Freezing drizzle' },
          61: { icon: '🌧️', text: 'Rain' },
          63: { icon: '🌧️', text: 'Rain' },
          65: { icon: '🌧️', text: 'Heavy rain' },
          66: { icon: '🌧️', text: 'Freezing rain' },
          67: { icon: '🌧️', text: 'Freezing rain' },
          71: { icon: '❄️', text: 'Snow' },
          73: { icon: '❄️', text: 'Snow' },
          75: { icon: '❄️', text: 'Heavy snow' },
          77: { icon: '❄️', text: 'Snow grains' },
          80: { icon: '🌧️', text: 'Rain showers' },
          81: { icon: '🌧️', text: 'Rain showers' },
          82: { icon: '🌧️', text: 'Heavy rain showers' },
          85: { icon: '❄️', text: 'Snow showers' },
          86: { icon: '❄️', text: 'Heavy snow showers' },
          95: { icon: '⛈️', text: 'Thunderstorm' },
          96: { icon: '⛈️', text: 'Thunderstorm with hail' },
          99: { icon: '⛈️', text: 'Thunderstorm with hail' }
        },
        de: {
          0: { icon: '☀️', text: 'Klar' },
          1: { icon: '☀️', text: 'Überwiegend klar' },
          2: { icon: '⛅', text: 'Teilweise bewölkt' },
          3: { icon: '☁️', text: 'Bedeckt' },
          45: { icon: '🌫️', text: 'Nebel' },
          48: { icon: '🌫️', text: 'Nebel' },
          51: { icon: '🌦️', text: 'Niesel' },
          53: { icon: '🌦️', text: 'Niesel' },
          55: { icon: '🌦️', text: 'Niesel' },
          56: { icon: '🌦️', text: 'Gefrierender Niesel' },
          57: { icon: '🌦️', text: 'Gefrierender Niesel' },
          61: { icon: '🌧️', text: 'Regen' },
          63: { icon: '🌧️', text: 'Regen' },
          65: { icon: '🌧️', text: 'Starker Regen' },
          66: { icon: '🌧️', text: 'Gefrierender Regen' },
          67: { icon: '🌧️', text: 'Gefrierender Regen' },
          71: { icon: '❄️', text: 'Schnee' },
          73: { icon: '❄️', text: 'Schnee' },
          75: { icon: '❄️', text: 'Starker Schnee' },
          77: { icon: '❄️', text: 'Schneegriesel' },
          80: { icon: '🌧️', text: 'Regenschauer' },
          81: { icon: '🌧️', text: 'Regenschauer' },
          82: { icon: '🌧️', text: 'Starke Regenschauer' },
          85: { icon: '❄️', text: 'Schneeschauer' },
          86: { icon: '❄️', text: 'Starke Schneeschauer' },
          95: { icon: '⛈️', text: 'Gewitter' },
          96: { icon: '⛈️', text: 'Gewitter mit Hagel' },
          99: { icon: '⛈️', text: 'Gewitter mit Hagel' }
        },
        it: {
          0: { icon: '☀️', text: 'Sereno' },
          1: { icon: '☀️', text: 'Prevalentemente sereno' },
          2: { icon: '⛅', text: 'Parzialmente nuvoloso' },
          3: { icon: '☁️', text: 'Nuvoloso' },
          45: { icon: '🌫️', text: 'Nebbia' },
          48: { icon: '🌫️', text: 'Nebbia' },
          51: { icon: '🌦️', text: 'Pioggerella' },
          53: { icon: '🌦️', text: 'Pioggerella' },
          55: { icon: '🌦️', text: 'Pioggerella' },
          56: { icon: '🌦️', text: 'Pioggerella gelata' },
          57: { icon: '🌦️', text: 'Pioggerella gelata' },
          61: { icon: '🌧️', text: 'Pioggia' },
          63: { icon: '🌧️', text: 'Pioggia' },
          65: { icon: '🌧️', text: 'Pioggia forte' },
          66: { icon: '🌧️', text: 'Pioggia gelata' },
          67: { icon: '🌧️', text: 'Pioggia gelata' },
          71: { icon: '❄️', text: 'Neve' },
          73: { icon: '❄️', text: 'Neve' },
          75: { icon: '❄️', text: 'Neve forte' },
          77: { icon: '❄️', text: 'Granelli di neve' },
          80: { icon: '🌧️', text: 'Rovesci di pioggia' },
          81: { icon: '🌧️', text: 'Rovesci di pioggia' },
          82: { icon: '🌧️', text: 'Rovesci di pioggia forti' },
          85: { icon: '❄️', text: 'Rovesci di neve' },
          86: { icon: '❄️', text: 'Rovesci di neve forti' },
          95: { icon: '⛈️', text: 'Temporale' },
          96: { icon: '⛈️', text: 'Temporale con grandine' },
          99: { icon: '⛈️', text: 'Temporale con grandine' }
        }
      };
      
      // Find closest match (exact or range)
      const langMap = codeMap[lang] || codeMap.en;
      if (langMap[code]) {
        return langMap[code];
      }
      
      // Fallback ranges
      if (code >= 1 && code <= 3) return langMap[2] || { icon: '⛅', text: 'Cloudy' };
      if (code >= 51 && code <= 67) return langMap[61] || { icon: '🌧️', text: 'Rain' };
      if (code >= 71 && code <= 77) return langMap[71] || { icon: '❄️', text: 'Snow' };
      if (code >= 80 && code <= 86) return langMap[80] || { icon: '🌧️', text: 'Showers' };
      if (code >= 95 && code <= 99) return langMap[95] || { icon: '⛈️', text: 'Thunderstorm' };
      
      // Default
      return { icon: '🌤️', text: langMap[0]?.text || 'Clear' };
    }
    
    // Mesec vidljiv samo noću (21:00–07:00 CET) — sunce danju
    var HEADER_MOON_NIGHT_ONLY = true;
    function isLocalNight() {
      if (!HEADER_MOON_NIGHT_ONLY) return true;
      const hour = new Date().getHours();
      return hour >= 21 || hour < 7;
    }
    // Faze meseca: API (0–1) → CSS klasa; fallback iz datuma
    function moonPhaseToClass(phase) {
      if (phase == null || phase < 0) return getMoonPhaseFromDate();
      if (phase < 0.03 || phase > 0.97) return 'phase-new';
      if (phase < 0.22) return 'phase-crescent-waxing';
      if (phase < 0.28) return 'phase-quarter-first';
      if (phase < 0.47) return 'phase-gibbous-waxing';
      if (phase < 0.53) return 'phase-full';
      if (phase < 0.72) return 'phase-gibbous-waning';
      if (phase < 0.78) return 'phase-quarter-last';
      return 'phase-crescent-waning';
    }
    function getMoonPhaseFromDate() {
      const knownNewMoon = new Date(2000, 0, 6, 18, 14).getTime();
      const lunarCycle = 29.53058867;
      const days = (Date.now() / 86400000 - knownNewMoon / 86400000) % lunarCycle;
      const phase = days / lunarCycle;
      if (phase < 0.03 || phase > 0.97) return 'phase-new';
      if (phase < 0.22) return 'phase-crescent-waxing';
      if (phase < 0.28) return 'phase-quarter-first';
      if (phase < 0.47) return 'phase-gibbous-waxing';
      if (phase < 0.53) return 'phase-full';
      if (phase < 0.72) return 'phase-gibbous-waning';
      if (phase < 0.78) return 'phase-quarter-last';
      return 'phase-crescent-waning';
    }
    function updateHeaderMoon(code, moonPhaseParam) {
      const moonEl = document.getElementById('header-moon');
      if (!moonEl) return;
      let codeVal = code;
      let moonPhase = moonPhaseParam;
      if (codeVal == null || moonPhase === undefined) {
        try {
          const cached = localStorage.getItem(WEATHER_CACHE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (codeVal == null) codeVal = parsed.weatherCode ?? 2;
            if (moonPhase === undefined) moonPhase = parsed.moonPhase;
          } else {
            if (codeVal == null) codeVal = 2;
          }
        } catch (e) { if (codeVal == null) codeVal = 2; }
      }
      const isNight = isLocalNight();
      const isClearOrCloudy = codeVal === 0 || codeVal === 1 || codeVal === 2 || codeVal === 3;
      const phaseClasses = ['phase-new','phase-crescent-waxing','phase-quarter-first','phase-gibbous-waxing','phase-full','phase-gibbous-waning','phase-quarter-last','phase-crescent-waning'];
      moonEl.classList.remove.apply(moonEl.classList, phaseClasses);
      if (isNight && isClearOrCloudy) {
        moonEl.classList.add('visible');
        moonEl.classList.add(moonPhaseToClass(moonPhase));
        moonEl.setAttribute('aria-hidden', 'false');
      } else {
        moonEl.classList.remove('visible');
        moonEl.setAttribute('aria-hidden', 'true');
      }
    }

    // Set header weather scene from WMO code
    function setHeaderWeatherSceneFromWmo(code, moonPhase) {
      const sceneEl = document.getElementById('header-weather-scene');
      if (!sceneEl) return;
      
      // Remove all scene classes
      sceneEl.className = 'header-weather-scene';
      
      // Map WMO code to scene class
      let sceneClass = 'scene-clouds'; // default
      
      if (code === 0 || code === 1) {
        sceneClass = isLocalNight() ? 'scene-night' : 'scene-clear';
      } else if (code === 2 || code === 3) {
        sceneClass = 'scene-clouds';
      } else if (code === 45 || code === 48) {
        sceneClass = 'scene-fog';
      } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
        sceneClass = 'scene-rain';
      } else if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
        sceneClass = 'scene-snow';
      } else if (code >= 95 && code <= 99) {
        sceneClass = 'scene-storm';
      }
      
      sceneEl.classList.add(sceneClass);
      updateHeaderMoon(code, moonPhase);
      
      // Handle storm lightning flashes
      if (sceneClass === 'scene-storm') {
        function triggerLightning() {
          sceneEl.classList.add('scene-flash');
          setTimeout(() => {
            sceneEl.classList.remove('scene-flash');
          }, 120 + Math.random() * 60); // 120-180ms
          
          // Schedule next flash
          const nextDelay = 7000 + Math.random() * 9000; // 7-16 seconds
          setTimeout(triggerLightning, nextDelay);
        }
        
        // Clear any existing timeout
        if (sceneEl._lightningTimeout) {
          clearTimeout(sceneEl._lightningTimeout);
        }
        
        // Start lightning sequence
        const initialDelay = 3000 + Math.random() * 5000; // 3-8 seconds initial
        sceneEl._lightningTimeout = setTimeout(triggerLightning, initialDelay);
      } else {
        // Clear lightning timeout if not storm
        if (sceneEl._lightningTimeout) {
          clearTimeout(sceneEl._lightningTimeout);
          sceneEl._lightningTimeout = null;
        }
        sceneEl.classList.remove('scene-flash');
      }
    }
    
    // Initialize weather scene immediately on page load
    function initWeatherScene() {
      const sceneEl = document.getElementById('header-weather-scene');
      if (!sceneEl) return;
      
      // Start with default scene immediately (no waiting)
      sceneEl.className = 'header-weather-scene scene-clouds';
      updateHeaderMoon(2); // cloudy default until weather loads
    }
    
    // Update weather location display
    function updateWeatherLocation() {
      const weatherLocation = document.getElementById('weather-location');
      if (!weatherLocation) return;
      
      // Get cached location or use default
      try {
        const cached = localStorage.getItem(WEATHER_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.city) {
            weatherLocation.textContent = parsed.city;
            return;
          }
        }
      } catch (e) {
        // Continue to fallback
      }
      
      // Fallback location text based on language
      const fallbackText = {
        sl: 'Blizu vas',
        en: 'Near you',
        de: 'In Ihrer Nähe',
        it: 'Vicino a te'
      };
      
      weatherLocation.textContent = fallbackText[currentLang] || fallbackText.en;
    }
    
    // Main weather update function
    async function updateWeather() {
      const weatherTemp = document.getElementById('weather-temp');
      const weatherIcon = document.getElementById('weather-icon');
      const weatherDesc = document.getElementById('weather-desc');
      const weatherLocation = document.getElementById('weather-location');
      
      if (!weatherTemp || !weatherIcon || !weatherDesc) return;
      
      // Show loading state
      weatherDesc.textContent = translations[currentLang]?.weather_loading || 'Loading...';
      weatherTemp.textContent = '--°';
      
      try {
        let coords;
        try {
          coords = await getEffectiveCoords();
        } catch (e) {
          coords = DEFAULT_COORDS;
        }
        if (!coords || typeof coords.lat !== 'number' || typeof coords.lon !== 'number') {
          coords = DEFAULT_COORDS;
        }
        
        // Update location display
        if (weatherLocation && coords.city) {
          weatherLocation.textContent = coords.city;
        } else {
          updateWeatherLocation();
        }
        
        // Fetch real weather
        const weatherData = await fetchOpenMeteoWeather(coords.lat, coords.lon);
        
        if (weatherData) {
          // Update temperature
          weatherTemp.textContent = `${weatherData.temp}°`;
          
          // Map weather code to icon and text
          const weatherInfo = weatherCodeToIconAndText(weatherData.code, currentLang);
          weatherIcon.textContent = weatherInfo.icon;
          weatherDesc.textContent = weatherInfo.text;
      weatherDesc.setAttribute('data-i18n', '');
      
          // Set header weather scene
          setHeaderWeatherSceneFromWmo(weatherData.code, weatherData.moonPhase);
          
          // Update cache with weather code and moon phase
          try {
            const cached = localStorage.getItem(WEATHER_CACHE_KEY);
            if (cached) {
              const parsed = JSON.parse(cached);
              parsed.weatherCode = weatherData.code;
              if (weatherData.moonPhase != null) parsed.moonPhase = weatherData.moonPhase;
              localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(parsed));
            }
          } catch (e) {
            // Ignore cache update errors
          }
        } else {
          // API failed – show error message
          weatherTemp.textContent = '--°';
          weatherIcon.textContent = '🌤️';
          weatherDesc.textContent = translations[currentLang]?.weather_error || 'Prognoza ni na voljo';
        }
      } catch (error) {
        console.error('Weather update error:', error);
        weatherTemp.textContent = '--°';
        weatherIcon.textContent = '🌤️';
        weatherDesc.textContent = translations[currentLang]?.weather_error || 'Prognoza ni na voljo';
      }
    }
    
    // Gallery lightbox
    let currentGalleryIndex = 0;
    const galleryItems = [];
    
    function initGallery() {
      document.querySelectorAll('.gallery-item').forEach((item, index) => {
        galleryItems.push(item);
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
          openLightbox(index);
        });
      });
    }

    function openLightbox(index) {
      currentGalleryIndex = index;
      const item = galleryItems[index];
      const lightbox = document.getElementById('lightbox');
      const lightboxContent = document.getElementById('lightbox-content');
      
      lightboxContent.innerHTML = '';
      
      if (item.querySelector('img')) {
        const img = item.querySelector('img').cloneNode(true);
        img.style.maxWidth = '100%';
        img.style.maxHeight = '90vh';
        img.style.objectFit = 'contain';
        lightboxContent.appendChild(img);
      } else if (item.querySelector('video')) {
        const video = item.querySelector('video').cloneNode(true);
        video.controls = true;
        video.style.maxWidth = '100%';
        video.style.maxHeight = '90vh';
        video.style.objectFit = 'contain';
        lightboxContent.appendChild(video);
      } else if (item.classList.contains('placeholder')) {
        const placeholder = item.cloneNode(true);
        placeholder.style.maxWidth = '80%';
        placeholder.style.maxHeight = '80vh';
        lightboxContent.appendChild(placeholder);
      }
      
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      const lightbox = document.getElementById('lightbox');
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
      const video = lightbox.querySelector('video');
      if (video) {
        video.pause();
      }
    }

    function navigateLightbox(direction) {
      if (direction === 'next') {
        currentGalleryIndex = (currentGalleryIndex + 1) % galleryItems.length;
      } else {
        currentGalleryIndex = (currentGalleryIndex - 1 + galleryItems.length) % galleryItems.length;
      }
      openLightbox(currentGalleryIndex);
    }

    document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
    document.getElementById('lightbox-prev').addEventListener('click', () => navigateLightbox('prev'));
    document.getElementById('lightbox-next').addEventListener('click', () => navigateLightbox('next'));
    
    document.getElementById('lightbox').addEventListener('click', (e) => {
      if (e.target.id === 'lightbox') {
        closeLightbox();
      }
    });

    // Swipe support for lightbox
    let touchStartX = 0;
    let touchEndX = 0;
    document.getElementById('lightbox').addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });
    document.getElementById('lightbox').addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          navigateLightbox('next');
        } else {
          navigateLightbox('prev');
        }
      }
    });

    initGallery();
    
    // Adrenalin quick action event listener
    
    const attractionsBack = document.getElementById('attractions-back');
    if (attractionsBack) {
      attractionsBack.addEventListener('click', closeAttractions);
    }
    
    // Swipe-back gesture helper function
    function addSwipeBack(screenElement, closeFunction) {
      if (!screenElement) return;
      
      let touchStartX = null;
      let touchStartY = null;
      let touchStartTime = null;
      let isSwiping = false;
      
      screenElement.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        // Only detect if touch starts within left 20px
        if (touch.clientX <= 20) {
          touchStartX = touch.clientX;
          touchStartY = touch.clientY;
          touchStartTime = Date.now();
          isSwiping = false;
        }
      }, { passive: true });
      
      screenElement.addEventListener('touchmove', (e) => {
        if (touchStartX === null) return;
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = Math.abs(touch.clientY - touchStartY);
        
        // Require horizontal movement > vertical movement
        if (deltaX > 0 && deltaX > deltaY && deltaX > 70) {
          // Swipe right detected - prevent browser default and trigger back action
          e.preventDefault();
          e.stopPropagation();
          if (!isSwiping) {
            isSwiping = true;
            closeFunction();
            touchStartX = null;
            touchStartY = null;
            touchStartTime = null;
          }
        }
      }, { passive: false }); // Promenjeno sa true na false da možemo preventDefault
      
      screenElement.addEventListener('touchend', (e) => {
        if (isSwiping) {
          e.preventDefault();
          e.stopPropagation();
        }
        touchStartX = null;
        touchStartY = null;
        touchStartTime = null;
        isSwiping = false;
      }, { passive: false });
    }
    
    // Swipe-back gesture for attractions screen
    const attractionsScreen = document.getElementById('attractions-screen');
    if (attractionsScreen) {
      addSwipeBack(attractionsScreen, closeAttractions);
    }
    
    // Swipe-back gesture for taxi-bus screen
    const taxiBusScreen = document.getElementById('taxi-bus-screen');
    if (taxiBusScreen) {
      addSwipeBack(taxiBusScreen, closeTaxiBus);
    }
    
    // Swipe-back gesture for adrenalin screen
    const adrenalinScreen = document.getElementById('adrenalin-screen');
    if (adrenalinScreen) {
      addSwipeBack(adrenalinScreen, closeAdrenalin);
    }
    const parkingScreenEl = document.getElementById('parking-screen');
    if (parkingScreenEl) {
      addSwipeBack(parkingScreenEl, closeParkingScreen);
    }
    // Swipe-back gesture for trip-ideas screen
    const tripIdeasScreen = document.getElementById('trip-ideas-screen');
    if (tripIdeasScreen) {
      addSwipeBack(tripIdeasScreen, closeTripIdeas);
    }
    
    // Swipe-back gesture for daily-essentials screen
    const dailyEssentialsScreen = document.getElementById('daily-essentials-screen');
    if (dailyEssentialsScreen) {
      addSwipeBack(dailyEssentialsScreen, closeDailyEssentials);
    }
    
    // Trip Ideas screen event listeners
    const tripIdeasBack = document.getElementById('trip-ideas-back');
    if (tripIdeasBack) {
      tripIdeasBack.addEventListener('click', closeTripIdeas);
    }
    
    // Daily Essentials screen functions
    function showDailyEssentialsScreen() {
      const screen = document.getElementById('daily-essentials-screen');
      if (screen) {
        screen.classList.add('show');
        loadDailyEssentialsFromDb();
        renderDailyEssentialsContent();
        history.pushState({ overlay: 'daily-essentials' }, '', window.location.pathname + window.location.search + (window.location.hash || ''));
      }
    }
    
    function hideDailyEssentialsScreen() {
      const screen = document.getElementById('daily-essentials-screen');
      if (screen) {
        screen.classList.remove('show');
      }
    }
    
    function openDailyEssentials() {
      closeAllPanels();
      showDailyEssentialsScreen();
    }
    
    function closeDailyEssentials() {
      hideDailyEssentialsScreen();
      window.APP.utils.scrollToTopReliable();
    }
    
    // Cache for DB-fetched daily essentials (null = not loaded yet)
    var _deDbCache = null;

    function loadDailyEssentialsFromDb() {
      var sb = window.supabaseClient || window.SB;
      if (!sb) return;
      var _munX = window._appMunicipality || 'bovec';
      sb.from('items')
        .select('data_json, order')
        .eq('section_key', 'daily_essentials')
        .is('tenant_id', null)
        .or('municipality_slugs.is.null,municipality_slugs.cs.{' + _munX + '}')
        .eq('visible', true)
        .order('order', { ascending: true })
        .then(function(r) {
          if (!r.error && r.data && r.data.length) {
            _deDbCache = r.data.map(function(row) { return row.data_json || {}; });
            var deScreen = document.getElementById('daily-essentials-screen');
            if (deScreen && deScreen.classList.contains('show')) { renderDailyEssentialsContent(); }
          }
        });
    }

    function renderDailyEssentialsContent() {
      const body = document.getElementById('daily-essentials-body');
      if (!body) return;
      
      const trans = translations[currentLang];
      if (!trans) return;
      
      var _deItems;
      if (_deDbCache && _deDbCache.length) {
        _deItems = _deDbCache.map(function(item) {
          return { labelKey: item.label_key, url: item.url, customLabel: item.custom_label };
        });
      } else {
        _deItems = (CL && CL.getDataset('dailyEssentials')) || [];
      }
      var _deLinks = _deItems.map(function(item) {
        var title = (item.labelKey === 'custom' && item.customLabel)
          ? item.customLabel
          : (trans[item.labelKey] || item.customLabel || item.labelKey || '');
        return '<a href="' + (item.url || '#') + '" target="_blank" rel="noopener noreferrer" class="quick-help-button">' +
               '<div class="quick-help-button-title">' + title + '</div>' +
               '</a>';
      }).join('\n          ');
      var html = '<div style="padding: 1rem;">' +
        '<div class="quick-help-section">' +
        '<h2 class="quick-help-section-title">' + (trans.daily_essentials || 'Daily essentials') + '</h2>' +
        _deLinks +
        '</div></div>';
      
      body.innerHTML = html;
    }
    
    // Daily Essentials screen event listeners
    const dailyEssentialsBack = document.getElementById('daily-essentials-back');
    if (dailyEssentialsBack) {
      dailyEssentialsBack.addEventListener('click', closeDailyEssentials);
    }
    
    // Taxi/Bus screen event listeners
    const taxiBusBack = document.getElementById('taxi-bus-back');
    if (taxiBusBack) {
      taxiBusBack.addEventListener('click', closeTaxiBus);
    }
    
    // Adrenalin screen functions
    function showAdrenalinScreen() {
      const screen = document.getElementById('adrenalin-screen');
      if (screen) {
        screen.classList.add('show');
        loadAdrenalinFromDb(); // fetch from DB; re-renders automatically if cache updates
        renderAdrenalinContent();
        history.pushState({ overlay: 'adrenalin' }, '', window.location.pathname + window.location.search + (window.location.hash || ''));
      }
    }
    
    function hideAdrenalinScreen() {
      const screen = document.getElementById('adrenalin-screen');
      if (screen) {
        screen.classList.remove('show');
      }
    }
    
    function openAdrenalin() {
      closeAllPanels();
      // Use new directory page via iframe modal if available
      if (window.__MODALS && window.__MODALS.openAktivnosti) {
        window.__MODALS.openAktivnosti();
      } else {
        showAdrenalinScreen(); // fallback to old screen
      }
    }
    
    function closeAdrenalin() {
      hideAdrenalinScreen();
      window.APP.utils.scrollToTopReliable();
    }
    
    // Activities data model
    const activities = [
      {
        id: 'activity-1',
        titleKey: null,
        subtitleKey: null,
        url: null,
        logo: null
      },
      {
        id: 'activity-2',
        titleKey: null,
        subtitleKey: null,
        url: null,
        logo: null
      },
      {
        id: 'activity-3',
        titleKey: null,
        subtitleKey: null,
        url: null,
        logo: null
      },
      {
        id: 'activity-4',
        titleKey: null,
        subtitleKey: null,
        url: null,
        logo: null
      },
      {
        id: 'activity-5',
        titleKey: null,
        subtitleKey: null,
        url: null,
        logo: null
      }
    ];

    // Default activity icons by category
    function getDefaultIcon(activityId) {
      const icons = {
        paragliding: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20M6.5 7.5C8 6 10 5 12 5s4 1 5.5 2.5M5 17c1.5 1.5 3.5 2.5 7 2.5s5.5-1 7-2.5"/></svg>`,
        rafting: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12c0-3 1.5-5 3-7 1.5 2 3 4 3 7s-1.5 5-3 7c-1.5-2-3-4-3-7zM15 12c0-3 1.5-5 3-7 1.5 2 3 4 3 7s-1.5 5-3 7c-1.5-2-3-4-3-7z"/><path d="M9 12c0-2 1-3.5 2-5 1 1.5 2 3 2 5s-1 3.5-2 5c-1-1.5-2-3-2-5z"/></svg>`,
        hiking: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>`,
        zipline: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
        canyoning: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V8M5 12H2a10 10 0 0 0 20 0h-3"/><circle cx="12" cy="5" r="3"/></svg>`
      };
      return icons[activityId] || icons.hiking;
    }

    // Render activities list
    function renderActivities() {
      const container = document.getElementById('activitiesList');
      if (!container) return;
      
      const trans = translations[currentLang];
      if (!trans) return;
      
      container.innerHTML = '';

      activities.forEach(activity => {
        const isDisabled = !activity.url || !activity.titleKey;
        const card = document.createElement('a');
        card.className = `activity-card ${isDisabled ? 'disabled' : ''}`;
        
        if (!isDisabled) {
          card.href = activity.url;
          card.target = '_blank';
          card.rel = 'noopener noreferrer';
        } else {
          card.href = '#';
          card.addEventListener('click', (e) => e.preventDefault());
        }

        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');

        // Logo
        const logo = document.createElement('div');
        logo.className = 'activity-logo';
        if (activity.logo) {
          logo.innerHTML = `<img src="${activity.logo}" alt="${activity.titleKey ? trans[activity.titleKey] : 'Activity'}" loading="lazy">`;
        } else {
          logo.innerHTML = getDefaultIcon(activity.id);
        }

        // Content
        const content = document.createElement('div');
        content.className = 'activity-content';

        const title = document.createElement('h2');
        title.className = 'activity-title';
        title.textContent = activity.titleKey ? (trans[activity.titleKey] || activity.titleKey) : '';

        const subtitle = document.createElement('p');
        subtitle.className = 'activity-subtitle';
        subtitle.textContent = activity.subtitleKey ? (trans[activity.subtitleKey] || activity.subtitleKey) : '';

        content.appendChild(title);
        content.appendChild(subtitle);

        // CTA or Badge
        let ctaElement;
        if (isDisabled) {
          ctaElement = document.createElement('div');
          ctaElement.className = 'disabled-badge';
          ctaElement.textContent = trans.activities_badge_coming_soon || trans.in_preparation || 'Coming soon';
        } else {
          ctaElement = document.createElement('div');
          ctaElement.className = 'activity-cta';
          ctaElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M7 7h10v10"/></svg>`;
        }

        card.appendChild(logo);
        card.appendChild(content);
        card.appendChild(ctaElement);

        container.appendChild(card);
      });

      // Keyboard accessibility for activity cards
      container.querySelectorAll('.activity-card').forEach(card => {
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !card.classList.contains('disabled')) {
            e.preventDefault();
            card.click();
          }
        });
      });
    }

    function renderAdrenalinContent() {
      const body = document.getElementById('adrenalin-body');
      if (!body) return;
      
      const trans = translations[currentLang] || translations.sl;
      if (!trans) return;

      var _providers = (_adrenalinDbCache && _adrenalinDbCache.length) ? _adrenalinDbCache : BOVEC_PROVIDERS;
      var featured = getFeaturedProviders(_providers);
      var allOrdered = getAllProvidersOrdered(_providers);
      var featuredHtml = featured.length >= 1 ? ('<h4 class="providers-subtitle">' + (trans.activity_highlighted || 'Istaknuti') + '</h4><div class="providers-featured">' + featured.map(renderProviderMiniBanner).join('') + '</div>') : '';
      var allHtml = '<h4 class="providers-subtitle">' + (trans.activity_all_providers || 'Svi provajderi') + '</h4><div class="providers-all">' + allOrdered.map(renderProviderMiniBanner).join('') + '</div>';
      var providersBlock = '<div class="providers-section"><h3 class="providers-section-title">' + (trans.activity_bovec_title || 'Aktivnosti – Občina Bovec') + '</h3>' + featuredHtml + allHtml + '</div>';
      
      body.innerHTML = providersBlock;
    }
    
    // Adrenalin screen event listeners
    const adrenalinBack = document.getElementById('adrenalin-back');
    if (adrenalinBack) {
      adrenalinBack.addEventListener('click', closeAdrenalin);
    }
    const parkingBack = document.getElementById('parking-back');
    if (parkingBack) {
      parkingBack.addEventListener('click', closeParkingScreen);
    }
    
    // Android (and browser) back button: close overlay instead of leaving page
    window.addEventListener('popstate', function() {
      // Check iframe modal first (it's "on top")
      if (window.__MODALS && window.__MODALS.isAnyModalOpen && window.__MODALS.isAnyModalOpen()) {
        if (window.__MODALS.closeModal) {
          window.__MODALS.closeModal();
        }
        return;
      }
      // Then check full-screen screens
      const attractionsScreen = document.getElementById('attractions-screen');
      const tripIdeasScreen = document.getElementById('trip-ideas-screen');
      const dailyEssentialsScreen = document.getElementById('daily-essentials-screen');
      const taxiBusScreen = document.getElementById('taxi-bus-screen');
      const adrenalinScreen = document.getElementById('adrenalin-screen');
      if (attractionsScreen && attractionsScreen.classList.contains('show')) {
        closeAttractions();
      } else if (tripIdeasScreen && tripIdeasScreen.classList.contains('show')) {
        closeTripIdeas();
      } else if (dailyEssentialsScreen && dailyEssentialsScreen.classList.contains('show')) {
        closeDailyEssentials();
      } else if (taxiBusScreen && taxiBusScreen.classList.contains('show')) {
        closeTaxiBus();
      } else if (adrenalinScreen && adrenalinScreen.classList.contains('show')) {
        closeAdrenalin();
      } else {
        var parkingScreenEl = document.getElementById('parking-screen');
        if (parkingScreenEl && parkingScreenEl.classList.contains('show')) {
          closeParkingScreen();
        }
      }
    });
    
    // Feedback Modal Functions
    const feedbackButton = document.getElementById('feedback-button');
    const feedbackModal = document.getElementById('feedback-modal');
    const feedbackModalClose = document.getElementById('feedback-modal-close');
    const feedbackModalOverlay = feedbackModal?.querySelector('.feedback-modal-overlay');
    const feedbackForm = document.getElementById('feedback-form');
    const feedbackCancel = document.getElementById('feedback-cancel');
    const feedbackError = document.getElementById('feedback-error');
    const feedbackSuccess = document.getElementById('feedback-success');
    
    function openFeedbackModal() {
      if (feedbackModal) {
        feedbackModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        // Update translations for placeholders
        updateFeedbackPlaceholders();
      }
    }
    
    function closeFeedbackModal() {
      if (feedbackModal) {
        feedbackModal.classList.remove('show');
        document.body.style.overflow = '';
        // Reset form
        if (feedbackForm) {
          feedbackForm.reset();
          feedbackError.style.display = 'none';
          feedbackSuccess.style.display = 'none';
        }
      }
    }
    
    function updateFeedbackPlaceholders() {
      const trans = translations[currentLang];
      if (!trans) return;
      
      const addTextarea = document.getElementById('feedback-add');
      const confusingTextarea = document.getElementById('feedback-confusing');
      const ideaTextarea = document.getElementById('feedback-idea');
      
      if (addTextarea && trans.feedback_add_placeholder) {
        addTextarea.placeholder = trans.feedback_add_placeholder;
      }
      if (confusingTextarea && trans.feedback_confusing_placeholder) {
        confusingTextarea.placeholder = trans.feedback_confusing_placeholder;
      }
      if (ideaTextarea && trans.feedback_idea_placeholder) {
        ideaTextarea.placeholder = trans.feedback_idea_placeholder;
      }
      return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
    
    function handleFeedbackSubmit(e) {
      e.preventDefault();
      
      const trans = translations[currentLang];
      if (!trans) return;
      
      const addValue = document.getElementById('feedback-add').value.trim();
      const confusingValue = document.getElementById('feedback-confusing').value.trim();
      const ideaValue = document.getElementById('feedback-idea').value.trim();
      const roleValue = feedbackForm.querySelector('input[name="role"]:checked')?.value || 'guest';
      
      // Validate required field
      if (!addValue) {
        feedbackError.textContent = trans.feedback_error || 'Please write at least one suggestion.';
        feedbackError.style.display = 'block';
        feedbackSuccess.style.display = 'none';
        return;
      }
      
      feedbackError.style.display = 'none';
      feedbackSuccess.style.display = 'none';

      var sb = window.supabaseClient || window.SB;
      var tenantSlug = (new URLSearchParams(window.location.search).get('t') || '').toLowerCase() || null;

      function _onSuccess() {
        feedbackSuccess.style.display = 'block';
        feedbackSuccess.textContent = trans.feedback_success || 'Hvala! Predlog je sačuvan.';
        feedbackForm.reset();
        setTimeout(function() { closeFeedbackModal(); }, 2200);
      }

      function _trySendEmail(w3fKey, adminEmail) {
        if (!w3fKey || !adminEmail) return;
        fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            access_key: w3fKey,
            to: adminEmail,
            subject: 'Novi predlog gosta — ' + (tenantSlug || 'sajt'),
            message: [
              addValue      ? 'Šta dodati: ' + addValue      : '',
              confusingValue? 'Nejasno: '    + confusingValue : '',
              ideaValue     ? 'Ideja: '      + ideaValue      : ''
            ].filter(Boolean).join('\n\n') + '\n\nUloga: ' + roleValue + ' | Jezik: ' + currentLang
          })
        }).catch(function(){});
      }

      if (sb) {
        sb.rpc('create_suggestion', {
          p_lang: currentLang, p_role: roleValue,
          p_add_text: addValue || null, p_confusing: confusingValue || null,
          p_idea: ideaValue || null, p_tenant_slug: tenantSlug
        }).then(function(r) {
          if (r && r.error) {
            feedbackError.textContent = trans.feedback_error || 'Greška. Pokušaj ponovo.';
            feedbackError.style.display = 'block';
            return;
          }
          _onSuccess();
          sb.from('items').select('data_json').eq('section_key','ui').eq('item_key','site_name').is('tenant_id',null).maybeSingle()
            .then(function(cfg) {
              if (!cfg.error && cfg.data && cfg.data.data_json) {
                _trySendEmail(cfg.data.data_json.w3f_key, cfg.data.data_json.admin_email);
              }
            });
        }).catch(function() { _onSuccess(); });
      } else {
        _onSuccess();
      }
    }
    
    // Event listeners
    if (feedbackButton) {
      feedbackButton.addEventListener('click', openFeedbackModal);
    }
    
    if (feedbackModalClose) {
      feedbackModalClose.addEventListener('click', closeFeedbackModal);
    }
    
    if (feedbackModalOverlay) {
      feedbackModalOverlay.addEventListener('click', (e) => {
        if (e.target === feedbackModalOverlay) {
          closeFeedbackModal();
        }
      });
    }
    
    if (feedbackCancel) {
      feedbackCancel.addEventListener('click', closeFeedbackModal);
    }
    
    if (feedbackForm) {
      feedbackForm.addEventListener('submit', handleFeedbackSubmit);
    }
    
    // Close on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && feedbackModal && feedbackModal.classList.contains('show')) {
        closeFeedbackModal();
      }
    });
    
    // Update feedback content when language changes
    const originalUpdateLanguageForFeedback = updateLanguage;
    updateLanguage = function(lang) {
      originalUpdateLanguageForFeedback(lang);
      if (feedbackModal && feedbackModal.classList.contains('show')) {
        updateFeedbackPlaceholders();
      }
    };
    
    // Handle URL hash on load and hash change
    window.addEventListener('hashchange', handleTripIdeasHash);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(handleTripIdeasHash, 100);
      });
    } else {
      setTimeout(handleTripIdeasHash, 100);
    }
    
    // Update trip ideas content when language changes
    const originalUpdateLanguage = updateLanguage;
    updateLanguage = function(lang) {
      originalUpdateLanguage(lang);
      const tripIdeasScreen = document.getElementById('trip-ideas-screen');
      if (tripIdeasScreen && tripIdeasScreen.classList.contains('show')) {
        const currentPlace = getTripIdeasPlace();
        renderTripIdeasContent(currentPlace);
      }
      const taxiBusScreen = document.getElementById('taxi-bus-screen');
      if (taxiBusScreen && taxiBusScreen.classList.contains('show')) {
        renderTaxiBusContent();
      }
      // Update feedback placeholders if modal is open
      if (typeof updateFeedbackPlaceholders === 'function') {
        const feedbackModal = document.getElementById('feedback-modal');
        if (feedbackModal && feedbackModal.classList.contains('show')) {
          updateFeedbackPlaceholders();
        }
      }
    };
    
    // Taxi/Bus screen functions
    function showTaxiBusScreen() {
      const screen = document.getElementById('taxi-bus-screen');
      if (screen) {
        screen.classList.add('show');
        loadTaxiFromDb(); // fetch from DB; re-renders automatically if cache updates
        renderTaxiBusContent();
        history.pushState({ overlay: 'taxi-bus' }, '', window.location.pathname + window.location.search + (window.location.hash || ''));
      }
    }
    
    function hideTaxiBusScreen() {
      const screen = document.getElementById('taxi-bus-screen');
      if (screen) {
        screen.classList.remove('show');
      }
    }
    
    function openTaxiBus() {
      closeAllPanels();
      // Use new directory page via iframe modal if available
      if (window.__MODALS && window.__MODALS.openTaxi) {
        window.__MODALS.openTaxi();
      } else {
        showTaxiBusScreen(); // fallback to old screen
      }
    }

    // ── Maintenance (Prijava okvare) modal ────────────────────────────────────
    (function() {
      var _maintModal   = document.getElementById('maintenance-modal');
      var _maintClose   = document.getElementById('maint-modal-close');
      var _maintSubmit  = document.getElementById('maint-submit');
      var _maintFormWrap= document.getElementById('maint-form-wrap');
      var _maintSuccess = document.getElementById('maint-success');
      var _maintNoEmail = document.getElementById('maint-no-email');
      var _maintError   = document.getElementById('maint-error');
      var _maintCat     = document.getElementById('maint-category');
      var _maintLoc     = document.getElementById('maint-location');
      var _maintDesc    = document.getElementById('maint-description');
      var _maintPhone   = document.getElementById('maint-phone-link');
      var _maintPhoneDisp = document.getElementById('maint-phone-display');

      function _closeMaint() {
        if (!_maintModal) return;
        _maintModal.style.display = 'none';
        document.body.style.overflow = '';
        if (_maintFormWrap) _maintFormWrap.style.display = '';
        if (_maintSuccess) _maintSuccess.style.display = 'none';
        if (_maintNoEmail) _maintNoEmail.style.display = 'none';
        if (_maintError)   _maintError.style.display   = 'none';
        if (_maintLoc)     _maintLoc.value = '';
        if (_maintDesc)    _maintDesc.value = '';
      }

      window.openMaintenanceModal = function() {
        if (!_maintModal) return;
        if (_maintFormWrap) _maintFormWrap.style.display = '';
        if (_maintSuccess) _maintSuccess.style.display = 'none';
        if (_maintNoEmail) _maintNoEmail.style.display = 'none';
        if (_maintError)   _maintError.style.display   = 'none';
        _maintModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        _updateMaintI18n();
      };

      function _updateMaintI18n() {
        var trans = (window.APP && window.APP.translations && window.APP.translations[currentLang]) || {};
        var opts = [
          { v:'electric',  k:'maint_cat_electric'  },
          { v:'water',     k:'maint_cat_water'     },
          { v:'wifi',      k:'maint_cat_wifi'      },
          { v:'cleaning',  k:'maint_cat_cleaning'  },
          { v:'appliance', k:'maint_cat_appliance' },
          { v:'other',     k:'maint_cat_other'     }
        ];
        if (_maintCat) {
          var cur = _maintCat.value;
          _maintCat.innerHTML = opts.map(function(o) {
            return '<option value="' + o.v + '"' + (o.v === cur ? ' selected' : '') + '>' + (trans[o.k] || o.v) + '</option>';
          }).join('');
        }
        document.querySelectorAll('[data-i18n^="maint_"]').forEach(function(el) {
          var k = el.getAttribute('data-i18n');
          if (trans[k]) el.textContent = trans[k];
        });
        document.querySelectorAll('[data-i18n-placeholder^="maint_"]').forEach(function(el) {
          var k = el.getAttribute('data-i18n-placeholder');
          if (trans[k]) el.placeholder = trans[k];
        });
      }

      if (_maintClose) _maintClose.addEventListener('click', _closeMaint);
      if (_maintModal) _maintModal.addEventListener('click', function(e) {
        if (e.target === _maintModal) _closeMaint();
      });

      if (_maintSubmit) {
        _maintSubmit.addEventListener('click', function() {
          var trans = (window.APP && window.APP.translations && window.APP.translations[currentLang]) || {};
          var slug = (new URLSearchParams(window.location.search).get('t') || '').toLowerCase().trim();
          var cat  = _maintCat  ? _maintCat.value : 'other';
          var loc  = _maintLoc  ? _maintLoc.value.trim()  : '';
          var desc = _maintDesc ? _maintDesc.value.trim() : '';

          if (_maintError) _maintError.style.display = 'none';

          var sb = window.supabaseClient || window.SB;

          // Load maintenance config (email + w3f_key) from tenant's default_config
          function _getOwnerConfig(cb) {
            if (!sb || !slug) { cb(null); return; }
            sb.rpc('get_guest_items_by_slug', { p_slug: slug })
              .then(function(r) {
                if (r.error || !r.data) { cb(null); return; }
                var cfgRow = r.data.find(function(x) { return x.item_key === 'default_config'; });
                var bookRow = r.data.find(function(x) { return x.item_key === 'rebook'; });
                var maintRow = r.data.find(function(x) { return x.item_key === 'maintenance_config'; });
                var email = (maintRow && maintRow.data_json && maintRow.data_json.email) || '';
                var phone = (cfgRow   && cfgRow.data_json   && cfgRow.data_json.owner_phone) ||
                            (bookRow  && bookRow.data_json  && bookRow.data_json.owner_phone) || '';
                var aptName = (cfgRow && cfgRow.data_json && cfgRow.data_json.apartment_name) || slug;
                cb({ email: email, phone: phone, aptName: aptName });
              }).catch(function() { cb(null); });
          }

          function _doSendEmail(cfg) {
            var emailTo = cfg && cfg.email;
            if (!emailTo) { _showNoEmail(cfg); return; }
            // Always use global MASTER Web3Forms key
            if (sb) {
              sb.from('items').select('data_json').eq('section_key','ui').eq('item_key','site_name').is('tenant_id',null).maybeSingle()
                .then(function(r) {
                  var key = (!r.error && r.data && r.data.data_json && r.data.data_json.w3f_key) || '';
                  if (key) { _sendViaW3f(key, emailTo, cfg); } else { _showNoEmail(cfg); }
                }).catch(function() { _showNoEmail(cfg); });
            } else {
              _showNoEmail(cfg);
            }
          }

          function _sendViaW3f(key, toEmail, cfg) {
            var trans = (window.APP && window.APP.translations && window.APP.translations[currentLang]) || {};
            var catLabel = (_maintCat && _maintCat.options[_maintCat.selectedIndex] && _maintCat.options[_maintCat.selectedIndex].text) || cat;
            var aptName = (cfg && cfg.aptName) || slug;
            fetch('https://api.web3forms.com/submit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify({
                access_key: key,
                to: toEmail,
                subject: '⚠️ PRIJAVA OKVARE – ' + aptName,
                message: [
                  'Lokacija: ' + aptName,
                  'Kategorija: ' + catLabel.toUpperCase(),
                  loc  ? 'Gde: ' + loc   : '',
                  desc ? 'Detalji: ' + desc : '',
                  'Vreme: ' + new Date().toLocaleString('sr-Latn'),
                  '',
                  'Ovo je automatsko obaveštenje iz vašeg digitalnog info panela.'
                ].filter(function(x){ return x !== ''; }).join('\n')
              })
            }).catch(function(){});
            _showSuccess();
          }

          function _showSuccess() {
            var trans = (window.APP && window.APP.translations && window.APP.translations[currentLang]) || {};
            if (_maintFormWrap) _maintFormWrap.style.display = 'none';
            if (_maintNoEmail)  _maintNoEmail.style.display  = 'none';
            if (_maintSuccess)  _maintSuccess.style.display  = 'block';
            var successP = _maintSuccess && _maintSuccess.querySelector('p');
            if (successP) successP.textContent = trans.maint_success || '✓ Sporočilo je bilo poslano!';
            setTimeout(function() { _closeMaint(); }, 3000);
          }

          function _showNoEmail(cfg) {
            var trans = (window.APP && window.APP.translations && window.APP.translations[currentLang]) || {};
            var phone = (cfg && cfg.phone) || '';
            if (_maintFormWrap) _maintFormWrap.style.display = 'none';
            if (_maintSuccess)  _maintSuccess.style.display  = 'none';
            if (_maintNoEmail)  _maintNoEmail.style.display  = 'block';
            var noEmailP = _maintNoEmail && _maintNoEmail.querySelector('p');
            if (noEmailP) noEmailP.textContent = trans.maint_no_email || 'Vlasnik nije dodao email. Pozovite:';
            if (_maintPhone)     _maintPhone.href = 'tel:' + phone;
            if (_maintPhoneDisp) _maintPhoneDisp.textContent = phone || '—';
          }

          // Save to DB then send email
          if (sb && slug) {
            if (_maintSubmit) { _maintSubmit.disabled = true; _maintSubmit.textContent = (((window.APP || {}).translations || {})[currentLang] || {}).maint_sending || 'Pošiljam…'; }
            sb.rpc('create_maintenance_report', {
              p_tenant_slug: slug, p_category: cat,
              p_location: loc || null, p_description: desc || null
            }).then(function(r) {
              if (_maintSubmit) { _maintSubmit.disabled = false; _maintSubmit.textContent = (((window.APP || {}).translations || {})[currentLang] || {}).maint_submit || 'Pošlji'; }
              _getOwnerConfig(_doSendEmail);
            }).catch(function() {
              if (_maintSubmit) { _maintSubmit.disabled = false; }
              _getOwnerConfig(_doSendEmail);
            });
          } else {
            _getOwnerConfig(_doSendEmail);
          }
        });
      }
    })();
    // ── End Maintenance modal ─────────────────────────────────────────────────
    
    function closeTaxiBus() {
      hideTaxiBusScreen();
      window.APP.utils.scrollToTopReliable();
    }
    
    // Cache for taxi services fetched from Supabase (null = not yet loaded)
    var _taxiDbCache = null;

    function loadTaxiFromDb() {
      if (_taxiDbCache !== null) return;
      if (!window.supabaseClient || typeof window.supabaseClient.from !== 'function') return;
      var _munT = window._appMunicipality || 'bovec';
      window.supabaseClient
        .from('items')
        .select('item_key, "order", data_json')
        .eq('section_key', 'taxi')
        .is('tenant_id', null)
        .eq('visible', true)
        .or('municipality_slugs.is.null,municipality_slugs.cs.{' + _munT + '}')
        .order('order', { ascending: true })
        .then(function (r) {
          if (r.error || !r.data || !r.data.length) return;
          _taxiDbCache = r.data.map(function (row) {
            var dj = row.data_json || {};
            return { name: dj.name || '', phone: dj.phone || '', tel: dj.tel || '' };
          });
          var screen = document.getElementById('taxi-bus-screen');
          if (screen && screen.classList.contains('show')) renderTaxiBusContent();
        })
        .catch(function () {});
    }

    function renderTaxiBusContent() {
      const body = document.getElementById('taxi-bus-body');
      if (!body) return;
      
      const trans = translations[currentLang];
      if (!trans) return;
      
      // Get origin from localStorage, default to Bovec
      const validOrigins = ['tolmin', 'kobarid', 'srpenica', 'zaga', 'bovec', 'cezsoča'];
      let origin = localStorage.getItem('quickHelp_origin') || 'bovec';
      if (!validOrigins.includes(origin)) {
        origin = 'bovec';
      }
      
      // Origin names, routes and destinations from data file
      var _tbData = (CL && CL.getDataset('taxiBus')) || {};
      const originNames = _tbData.originNames || {};
      const routeUrls = _tbData.routeUrls || {};
      const destinations = _tbData.destinations || [];
      
      let html = `<div style="padding: 1rem;">`;
      
      // Taxi Services — prefer DB cache, fall back to hardcoded
      var _taxiServices = (_taxiDbCache && _taxiDbCache.length)
        ? _taxiDbCache
        : (_tbData.taxiServices || []);
      var _taxiListHtml = _taxiServices.map(function(svc) {
        return '<div class="quick-help-taxi-item">' +
          '<div class="quick-help-taxi-name">' + svc.name + '</div>' +
          '<div class="quick-help-taxi-actions">' +
          '<span class="quick-help-taxi-phone-display">' + svc.phone + '</span>' +
          '<a href="' + svc.tel + '" class="quick-help-call-btn">' + (trans.call || 'Pozovi') + '</a>' +
          '</div></div>';
      }).join('');
      html += `<div class="quick-help-section">
        <h2 class="quick-help-section-title">${trans.taxi_services || 'Taxi službe'}</h2>
        <div class="quick-help-taxi-list">${_taxiListHtml}</div>
      </div>`;
      
      // Origin Selector
      html += `<div class="quick-help-origin-selector">
        <div class="quick-help-origin-label">${trans.quick_help_where_are_you || ''}</div>
        <div class="quick-help-origin-grid">`;
      
      const originOrder = _tbData.originOrder || ['tolmin', 'kobarid', 'srpenica', 'zaga', 'bovec', 'cezso\u010da'];
      originOrder.forEach(orig => {
        const isSelected = orig === origin;
        const name = originNames[orig]?.[currentLang] || orig;
        html += `<div class="quick-help-origin-card ${isSelected ? 'selected' : ''}" data-origin="${orig}">
          <div class="quick-help-origin-card-title">${name}</div>
        </div>`;
      });
      
      html += `</div></div>`;
      
      // Transport Section
      html += `<div class="quick-help-section">
        <h2 class="quick-help-section-title">${trans.quick_help_transport || ''}</h2>
        
        <!-- Bus Timetable -->
        <a href="https://www.nomago.si/en/timetable" target="_blank" rel="noopener noreferrer" class="quick-help-button">
          <div class="quick-help-button-title">${trans.quick_help_bus_timetable || ''}</div>
          <div class="quick-help-button-desc">${trans.quick_help_bus_timetable_desc || ''}</div>
        </a>
        
        <!-- Download App -->
        <div style="margin-bottom: 0.75rem;">
          <div class="quick-help-button-title" style="margin-bottom: 0.75rem;">${trans.quick_help_download_app || ''}</div>
          <div class="quick-help-app-buttons">
            <a href="https://apps.apple.com/us/app/nomago/id6475821750" target="_blank" rel="noopener noreferrer" class="quick-help-app-button">
              ${trans.quick_help_download_ios || ''}
            </a>
            <a href="https://play.google.com/store/apps/details?id=si.nomago.maas.android" target="_blank" rel="noopener noreferrer" class="quick-help-app-button">
              ${trans.quick_help_download_android || ''}
            </a>
          </div>
        </div>
        
        <!-- Navigation Routes -->
        <div style="margin-bottom: 0.75rem;">
          <div class="quick-help-button-title" style="margin-bottom: 0.75rem;">${trans.quick_help_common_routes || ''}</div>`;
      
      // Generate route buttons based on origin
      const originRoutes = routeUrls[origin] || {};
      destinations.forEach(dest => {
        // Skip if origin equals destination
        if (origin === dest.key) return;
        
        const url = originRoutes[dest.key];
        if (url) {
          html += `<a href="${url}" target="_blank" rel="noopener noreferrer" class="quick-help-button">
            <div class="quick-help-button-title">${trans[dest.labelKey] || ''}</div>
          </a>`;
        }
      });
      
      html += `</div>
        
        <!-- Bus Info Note -->
        <div class="quick-help-info-note">
          ${trans.quick_help_bus_info || ''}
        </div>
      </div>`;
      
      html += `</div>`;
      
      body.innerHTML = html;
      
      // Add event listeners for origin selector
      document.querySelectorAll('.quick-help-origin-card').forEach(card => {
        card.addEventListener('click', () => {
          const newOrigin = card.getAttribute('data-origin');
          if (newOrigin && newOrigin !== origin) {
            localStorage.setItem('quickHelp_origin', newOrigin);
            renderTaxiBusContent();
          }
        });
      });
    }

    // Initialize weather scene immediately (don't wait for API)
    initWeatherScene();
    
    // Update weather on load and every 15 minutes
    updateWeather();
    setInterval(updateWeather, WEATHER_REFRESH_INTERVAL);
    setInterval(function() { updateHeaderMoon(null); }, 60 * 1000); // Moon: provera svaki minut (21:00/06:00)

    // Element SDK
    async function onConfigChange(config) {
      const customFont = config.font_family || defaultConfig.font_family;
      const baseFontStack = 'system-ui, -apple-system, sans-serif';
      const baseSize = config.font_size || defaultConfig.font_size;
      
      const backgroundColor = config.background_color || defaultConfig.background_color;
      const cardColor = config.card_color || defaultConfig.card_color;
      const textColor = config.text_color || defaultConfig.text_color;
      const accentColor = config.accent_color || defaultConfig.accent_color;
      const highlightColor = config.highlight_color || defaultConfig.highlight_color;

      document.documentElement.style.setProperty('--bg-dark', backgroundColor);
      document.documentElement.style.setProperty('--glass-bg', cardColor);
      document.documentElement.style.setProperty('--text-primary', textColor);
      document.documentElement.style.setProperty('--accent', accentColor);
      document.documentElement.style.setProperty('--accent-strong', highlightColor);

      document.body.style.fontFamily = `${customFont}, ${baseFontStack}`;
      document.body.style.fontSize = `${baseSize}px`;

      const apartmentName = config.apartment_name || defaultConfig.apartment_name;
      document.getElementById('app-title').textContent = apartmentName;
      const heroTitle = document.getElementById('hero-title');
      if (heroTitle) {
        heroTitle.textContent = apartmentName.split(' ')[0];
      }
      const welcomeSubtitle = document.getElementById('welcome-subtitle');
      if (welcomeSubtitle) {
        welcomeSubtitle.textContent = apartmentName;
      }

      const heroLocation = document.getElementById('hero-location');
      if (heroLocation) {
        const locationText = config.location_subtitle || defaultConfig.location_subtitle;
        // Remove "Bovec, " if present, keep only country
        heroLocation.textContent = locationText.replace(/^Bovec,\s*/i, '');
      }

      // Weather location is now dynamic, no need to update from config

      const hostPhone = config.host_phone || defaultConfig.host_phone;
      const callAction = document.getElementById('call-action');
      if (callAction) {
        callAction.href = `tel:${hostPhone.replace(/\s/g, '')}`;
      }

      const mapsLink = config.maps_link || defaultConfig.maps_link;
      const directionsAction = document.getElementById('directions-action');
      if (directionsAction && mapsLink) {
        directionsAction.href = mapsLink;
      }
    }

    function mapToCapabilities(config) {
      return {
        recolorables: [
          {
            get: () => config.background_color || defaultConfig.background_color,
            set: (value) => {
              config.background_color = value;
              if (window.elementSdk) {
                window.elementSdk.setConfig({ background_color: value });
              }
            }
          },
          {
            get: () => config.card_color || defaultConfig.card_color,
            set: (value) => {
              config.card_color = value;
              if (window.elementSdk) {
                window.elementSdk.setConfig({ card_color: value });
              }
            }
          },
          {
            get: () => config.text_color || defaultConfig.text_color,
            set: (value) => {
              config.text_color = value;
              if (window.elementSdk) {
                window.elementSdk.setConfig({ text_color: value });
              }
            }
          },
          {
            get: () => config.accent_color || defaultConfig.accent_color,
            set: (value) => {
              config.accent_color = value;
              if (window.elementSdk) {
                window.elementSdk.setConfig({ accent_color: value });
              }
            }
          },
          {
            get: () => config.highlight_color || defaultConfig.highlight_color,
            set: (value) => {
              config.highlight_color = value;
              if (window.elementSdk) {
                window.elementSdk.setConfig({ highlight_color: value });
              }
            }
          }
        ],
        borderables: [],
        fontEditable: {
          get: () => config.font_family || defaultConfig.font_family,
          set: (value) => {
            config.font_family = value;
            if (window.elementSdk) {
              window.elementSdk.setConfig({ font_family: value });
            }
          }
        },
        fontSizeable: {
          get: () => config.font_size || defaultConfig.font_size,
          set: (value) => {
            config.font_size = value;
            if (window.elementSdk) {
              window.elementSdk.setConfig({ font_size: value });
            }
          }
        }
      };
    }

    function mapToEditPanelValues(config) {
      return new Map([
        ["apartment_name", config.apartment_name || defaultConfig.apartment_name],
        ["location_subtitle", config.location_subtitle || defaultConfig.location_subtitle],
        ["full_address", config.full_address || defaultConfig.full_address],
        ["checkin_time", config.checkin_time || defaultConfig.checkin_time],
        ["checkout_time", config.checkout_time || defaultConfig.checkout_time],
        ["host_phone", config.host_phone || defaultConfig.host_phone],
        ["host_whatsapp", config.host_whatsapp || defaultConfig.host_whatsapp],
        ["host_email", config.host_email || defaultConfig.host_email],
        ["wifi_ssid", config.wifi_ssid || defaultConfig.wifi_ssid],
        ["wifi_password", config.wifi_password || defaultConfig.wifi_password],
        ["maps_link", config.maps_link || defaultConfig.maps_link]
      ]);
    }

    if (window.elementSdk) {
      window.elementSdk.init({
        defaultConfig,
        onConfigChange,
        mapToCapabilities,
        mapToEditPanelValues
      });
    }

    // ── Robust rules-link interceptor: always preserves ?t= slug ─────────────
    // Runs in capture phase so it fires before any existing handlers.
    document.addEventListener('click', function (e) {
      var slug = new URLSearchParams(window.location.search).get('t');
      if (!slug) return;

      var el = e.target && e.target.closest ? e.target.closest('a,button') : null;
      if (!el) return;

      var href = (el.getAttribute && el.getAttribute('href')) || '';
      var isRules =
        (el.id === 'rules-action') ||
        (href && href.indexOf('pravila/index.html') !== -1);

      if (!isRules) return;

      var forced = './pravila/index.html?t=' + encodeURIComponent(slug);
      e.preventDefault();
      e.stopPropagation();
      window.location.href = forced;
    }, true); // capture=true: runs before any bubbling handlers

})();
