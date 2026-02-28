/**
 * directory.js — Reusable Partners Directory
 * Used by: aktivnosti/index.html, restavracije/index.html, taxi/index.html
 *
 * URL params:
 *   ?type=activities|food|taxi  (required)
 *   ?lang=sl|en|de|it|pl|cs    (optional, falls back to localStorage)
 *   ?mun=bovec|kobarid|tolmin  (optional, falls back to parent window or 'bovec')
 */
(function () {
  'use strict';

  // ── Config ────────────────────────────────────────────────────────────────
  var SUPPORTED_LANGS = ['sl', 'en', 'de', 'it', 'pl', 'cs'];

  var CATEGORY_LABELS = {
    // activities (active set)
    rafting:     { sl:'Rafting',      en:'Rafting',     de:'Rafting',    it:'Rafting',      pl:'Rafting',            cs:'Rafting' },
    kayak:       { sl:'Kajak',        en:'Kayak',       de:'Kajak',      it:'Kayak',         pl:'Kajak',              cs:'Kajak' },
    canyoning:   { sl:'Kanjoning',    en:'Canyoning',   de:'Canyoning',  it:'Canyoning',     pl:'Kanjoning',          cs:'Canyoning' },
    zipline:     { sl:'Zipline',      en:'Zipline',     de:'Zipline',    it:'Zipline',        pl:'Zipline',            cs:'Zipline' },
    cycling:     { sl:'Kolesarstvo',  en:'Cycling',     de:'Radfahren',  it:'Ciclismo',       pl:'Kolarstwo',          cs:'Cyklistika' },
    paragliding: { sl:'Paragliding',  en:'Paragliding', de:'Paragliding',it:'Parapendio',     pl:'Paralotniarstwo',    cs:'Paragliding' },
    skydiving:   { sl:'Skydiving',    en:'Skydiving',   de:'Fallschirmspringen',it:'Paracadutismo',pl:'Spadochroniarstwo',cs:'Skydiving' },
    // activities (legacy — display only, not in add-form)
    hiking:      { sl:'Planinarenje', en:'Hiking',      de:'Wandern',    it:'Escursionismo',  pl:'Piesze wycieczki',   cs:'Turistika' },
    climbing:    { sl:'Plezanje',     en:'Climbing',    de:'Klettern',   it:'Arrampicata',    pl:'Wspinaczka',         cs:'Lezení' },
    other_act:   { sl:'Ostalo',       en:'Other',       de:'Sonstiges',  it:'Altro',           pl:'Inne',               cs:'Jiné' },
    // food (active set)
    cafe:        { sl:'Kavarna',      en:'Café',        de:'Café',       it:'Caffè',           pl:'Kawiarnia',          cs:'Kavárna' },
    street_food: { sl:'Street food',  en:'Street food', de:'Street food',it:'Street food',     pl:'Street food',        cs:'Street food' },
    gostilna:    { sl:'Gostilna',     en:'Inn',         de:'Gasthaus',   it:'Locanda',          pl:'Gospoda',            cs:'Hostinec' },
    restaurant:  { sl:'Restavracija', en:'Restaurant',  de:'Restaurant', it:'Ristorante',       pl:'Restauracja',        cs:'Restaurace' },
    pizzeria:    { sl:'Pizzerija',    en:'Pizzeria',    de:'Pizzeria',   it:'Pizzeria',          pl:'Pizzeria',           cs:'Pizzerie' },
    // food (legacy)
    bar:         { sl:'Bar',          en:'Bar',         de:'Bar',        it:'Bar',               pl:'Bar',                cs:'Bar' },
    bistro:      { sl:'Bistro',       en:'Bistro',      de:'Bistro',     it:'Bistro',             pl:'Bistro',             cs:'Bistro' },
    brewery:     { sl:'Pivovarna',    en:'Brewery',     de:'Brauerei',   it:'Birrificio',          pl:'Browar',             cs:'Pivovar' },
    other_food:  { sl:'Ostalo',       en:'Other',       de:'Sonstiges',  it:'Altro',               pl:'Inne',               cs:'Jiné' },
    // taxi (active set)
    taxi:        { sl:'Taksi',        en:'Taxi',        de:'Taxi',       it:'Taxi',               pl:'Taxi',               cs:'Taxi' },
    // taxi (legacy)
    transfer:    { sl:'Transfer',     en:'Transfer',    de:'Transfer',   it:'Transfer',            pl:'Transfer',           cs:'Transfer' },
    bus:         { sl:'Bus',          en:'Bus',         de:'Bus',        it:'Bus',                 pl:'Bus',                cs:'Bus' },
    other_taxi:  { sl:'Ostalo',       en:'Other',       de:'Sonstiges',  it:'Altro',               pl:'Inne',               cs:'Jiné' }
  };

  var PAGE_I18N = {
    activities: {
      sl:'Adrenalin & Aktivnosti', en:'Adrenalin & Activities', de:'Adrenalin & Aktivitäten',
      it:'Adrenalina & Attività',  pl:'Adrenalina & Aktywności', cs:'Adrenalin & Aktivity'
    },
    food: {
      sl:'Restavracije & Kavarne', en:'Restaurants & Cafés',    de:'Restaurants & Cafés',
      it:'Ristoranti & Caffè',     pl:'Restauracje & Kawiarnie', cs:'Restaurace & Kavárny'
    },
    taxi: {
      sl:'Taxi',  en:'Taxi',  de:'Taxi',
      it:'Taxi',  pl:'Taxi',  cs:'Taxi'
    }
  };

  var TIER_LABELS = {
    premium:  { sl:'⭐ Priporočamo',    en:'⭐ Recommended',  de:'⭐ Empfohlen',  it:'⭐ Consigliato',  pl:'⭐ Polecane',       cs:'⭐ Doporučujeme' },
    featured: { sl:'🔥 Popularno',      en:'🔥 Popular',      de:'🔥 Beliebt',     it:'🔥 Popolare',     pl:'🔥 Popularne',      cs:'🔥 Oblíbené' },
    standard: { sl:'📍 Vsi ponudniki',  en:'📍 All providers',de:'📍 Alle Anbieter',it:'📍 Tutti',        pl:'📍 Wszyscy',        cs:'📍 Všichni' }
  };

  var UI_I18N = {
    sl: { back:'← Nazaj', all:'Vse', call:'Pokliči', whatsapp:'WhatsApp', book:'Rezerviraj', website:'Spletna stran', no_results:'Ni rezultatov.' },
    en: { back:'← Back',  all:'All', call:'Call',    whatsapp:'WhatsApp', book:'Book',       website:'Website',       no_results:'No results.' },
    de: { back:'← Zurück',all:'Alle',call:'Anrufen', whatsapp:'WhatsApp', book:'Buchen',     website:'Webseite',      no_results:'Keine Ergebnisse.' },
    it: { back:'← Indietro',all:'Tutti',call:'Chiama',whatsapp:'WhatsApp',book:'Prenota',   website:'Sito web',      no_results:'Nessun risultato.' },
    pl: { back:'← Wstecz',all:'Wszystkie',call:'Zadzwoń',whatsapp:'WhatsApp',book:'Zarezerwuj',website:'Strona',      no_results:'Brak wyników.' },
    cs: { back:'← Zpět', all:'Vše',  call:'Zavolat', whatsapp:'WhatsApp', book:'Rezervovat', website:'Web',           no_results:'Žádné výsledky.' }
  };

  // ── State ─────────────────────────────────────────────────────────────────
  var params      = new URLSearchParams(window.location.search);
  // window._DIR_TYPE set by the host HTML page takes priority over URL param
  var TYPE        = window._DIR_TYPE || params.get('type') || 'activities';
  var LANG        = (params.get('lang') || localStorage.getItem('preferredLanguage') || 'sl').toLowerCase();
  if (!SUPPORTED_LANGS.includes(LANG)) LANG = 'sl';
  var MUN         = params.get('mun') || window._appMunicipality || 'bovec';
  var PAGE_PATH   = window.location.pathname;
  var ALL_PARTNERS = [];
  var currentFilter = 'all';
  var _impressionsSent = {}; // de-dup cache: key -> true

  function t(key) {
    var ui = UI_I18N[LANG] || UI_I18N.sl;
    return ui[key] || key;
  }
  function catLabel(cat) {
    var m = CATEGORY_LABELS[cat];
    if (!m) return cat;
    return m[LANG] || m.en || cat;
  }
  function tierLabel(tier) {
    var m = TIER_LABELS[tier];
    if (!m) return tier;
    return m[LANG] || m.en || tier;
  }
  function pageTitle() {
    var m = PAGE_I18N[TYPE];
    if (!m) return TYPE;
    return m[LANG] || m.en || TYPE;
  }

  // ── Tracking — sve ide kroz GA4 ──────────────────────────────────────────
  function _ga4(eventName, params) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, params);
  }

  function _impressionKey(partnerId) {
    return partnerId + '|' + PAGE_PATH + '|' + currentFilter;
  }

  function trackImpression(partner) {
    var key = _impressionKey(partner.id);
    if (_impressionsSent[key]) return; // de-dup
    _impressionsSent[key] = true;
    _ga4('partner_impression', {
      partner_name:      partner.name,
      partner_type:      partner.type,
      partner_category:  partner.category,
      partner_tier:      partner.tier,
      municipality:      MUN,
      page_path:         PAGE_PATH
    });
  }

  function trackClick(partner, eventName, filterValue) {
    var params = {
      partner_name:     partner.name || 'filter',
      partner_type:     partner.type || TYPE,
      partner_category: partner.category || '',
      partner_tier:     partner.tier || '',
      municipality:     MUN,
      page_path:        PAGE_PATH
    };
    if (filterValue) params.filter_value = filterValue;
    _ga4(eventName, params);
  }

  // ── Supabase load ─────────────────────────────────────────────────────────
  function loadPartners() {
    var sb = window.supabaseClient || window.SB;
    if (!sb) { setTimeout(loadPartners, 200); return; }
    sb.from('partners')
      .select('*')
      .eq('type', TYPE)
      .eq('is_active', true)
      .order('tier')        // premium first by default sort
      .order('order_index')
      .then(function (r) {
        if (r.error || !r.data) { renderAll([]); return; }
        // Filter by municipality
        ALL_PARTNERS = r.data.filter(function (p) {
          return p.all_municipalities || (p.municipalities && p.municipalities.indexOf(MUN) >= 0);
        });
        renderAll(ALL_PARTNERS);
      })
      .catch(function () { renderAll([]); });
  }

  // ── Render ────────────────────────────────────────────────────────────────
  function getFiltered() {
    if (currentFilter === 'all') return ALL_PARTNERS;
    return ALL_PARTNERS.filter(function (p) { return p.category === currentFilter; });
  }

  function renderAll(partners) {
    _renderChips(partners);
    _renderSections(getFiltered());
  }

  function _renderChips(partners) {
    var bar = document.getElementById('dir-chips');
    if (!bar) return;
    var cats = [];
    partners.forEach(function (p) {
      if (cats.indexOf(p.category) < 0) cats.push(p.category);
    });
    var html = '<button class="dir-chip' + (currentFilter === 'all' ? ' active' : '') + '" data-cat="all" aria-selected="' + (currentFilter === 'all') + '">' + t('all') + '</button>';
    cats.forEach(function (c) {
      var active = currentFilter === c;
      html += '<button class="dir-chip' + (active ? ' active' : '') + '" data-cat="' + _esc(c) + '" aria-selected="' + active + '">' + catLabel(c) + '</button>';
    });
    bar.innerHTML = html;
    bar.querySelectorAll('.dir-chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = this.getAttribute('data-cat');
        if (cat === currentFilter) return;
        currentFilter = cat;
        if (cat !== 'all') trackClick({ id: null, type: TYPE, category: cat, tier: '' }, 'filter_used', cat);
        _renderChips(ALL_PARTNERS);
        _renderSections(getFiltered());
      });
    });
  }

  // Fisher-Yates shuffle — returns a new shuffled copy, original untouched
  function _shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function _renderSections(partners) {
    var tiers = ['premium', 'featured', 'standard'];
    tiers.forEach(function (tier) {
      var group = _shuffle(partners.filter(function (p) { return p.tier === tier; }));
      var sec = document.getElementById('dir-sec-' + tier);
      var hdr = document.getElementById('dir-hdr-' + tier);
      if (!sec) return;
      if (!group.length) {
        if (hdr) hdr.style.display = 'none';
        sec.innerHTML = '';
        return;
      }
      if (hdr) hdr.style.display = '';
      if (tier === 'premium')  sec.innerHTML = group.map(_cardPremium).join('');
      if (tier === 'featured') sec.innerHTML = group.map(_cardFeatured).join('');
      if (tier === 'standard') sec.innerHTML = group.map(_cardStandard).join('');

      // Bind clicks + track impressions
      sec.querySelectorAll('[data-pid]').forEach(function (el) {
        var pid = el.getAttribute('data-pid');
        var partner = _findById(pid);
        if (!partner) return;
        // Intersection Observer for impression
        if (window.IntersectionObserver) {
          new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (e) {
              if (e.isIntersecting) { trackImpression(partner); obs.disconnect(); }
            });
          }, { threshold: 0.5 }).observe(el);
        } else {
          trackImpression(partner); // fallback: track on render
        }
        // Click: open
        el.addEventListener('click', function (ev) {
          if (ev.target.closest('a,button')) return; // handled separately
          trackClick(partner, 'click_open');
        });
        // Buttons
        var btnCall    = el.querySelector('.dir-btn-call');
        var btnWa      = el.querySelector('.dir-btn-wa');
        var btnBook    = el.querySelector('.dir-btn-book');
        if (btnCall)  btnCall.addEventListener('click',  function () { trackClick(partner, 'click_call'); });
        if (btnWa)    btnWa.addEventListener('click',    function () { trackClick(partner, 'click_whatsapp'); });
        if (btnBook)  btnBook.addEventListener('click',  function () { trackClick(partner, 'click_booking'); });
      });
    });

    // Empty state
    var empty = document.getElementById('dir-empty');
    if (empty) empty.style.display = partners.length ? 'none' : 'block';
  }

  function _findById(id) {
    for (var i = 0; i < ALL_PARTNERS.length; i++) {
      if (ALL_PARTNERS[i].id === id) return ALL_PARTNERS[i];
    }
    return null;
  }

  // ── Card templates ────────────────────────────────────────────────────────
  function _btns(p) {
    var b = '';
    if (p.phone)       b += '<a href="tel:' + _esc(p.phone.replace(/\s/g,'')) + '" class="dir-btn dir-btn-call" aria-label="Call ' + _esc(p.name) + '">' + t('call') + '</a>';
    if (p.whatsapp)    b += '<a href="https://wa.me/' + _esc(p.whatsapp.replace(/[\s+\-()]/g,'')) + '" class="dir-btn dir-btn-wa" target="_blank" rel="noopener" aria-label="WhatsApp ' + _esc(p.name) + '">' + t('whatsapp') + '</a>';
    var webUrl = p.booking_url || p.website_url;
    if (p.booking_url) b += '<a href="' + _esc(p.booking_url) + '" class="dir-btn dir-btn-book" target="_blank" rel="noopener" aria-label="Book ' + _esc(p.name) + '">' + t('book') + '</a>';
    else if (p.website_url) b += '<a href="' + _esc(p.website_url) + '" class="dir-btn dir-btn-web" target="_blank" rel="noopener" aria-label="Website ' + _esc(p.name) + '">' + t('website') + '</a>';
    return b;
  }

  function _logoEl(p, size) {
    // size: 'sm' (36px) | 'md' (48px)
    var px = size === 'md' ? '48' : '36';
    if (p.logo_url) {
      return '<img src="' + _esc(p.logo_url) + '" alt="' + _esc(p.name) + ' logo" class="dir-logo" style="width:' + px + 'px;height:' + px + 'px">';
    }
    return '<div class="dir-logo dir-logo--placeholder" style="width:' + px + 'px;height:' + px + 'px">' +
      (p.name ? _esc(p.name.charAt(0).toUpperCase()) : '?') + '</div>';
  }

  function _ytIdFromUrl(url) {
    if (!url) return '';
    var raw = String(url).trim();
    var m = raw.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (m && m[1]) return m[1];
    m = raw.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (m && m[1]) return m[1];
    m = raw.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (m && m[1]) return m[1];
    m = raw.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (m && m[1]) return m[1];
    return '';
  }

  function _coverMediaHtml(p, variant) {
    var cls = variant === 'featured' ? 'dir-feat-img' : 'dir-card-img';
    var ytId = _ytIdFromUrl(p.cover_youtube_url);
    if (ytId) {
      var embed = 'https://www.youtube.com/embed/' + _esc(ytId) + '?autoplay=1&mute=1&playsinline=1&controls=0&rel=0&loop=1&playlist=' + _esc(ytId);
      var thumb = 'https://img.youtube.com/vi/' + _esc(ytId) + '/hqdefault.jpg';
      return '<div class="' + cls + ' dir-video-wrap">' +
        '<iframe src="' + embed + '" title="' + _esc(p.name) + ' video cover" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>' +
        '<a href="' + _esc(p.cover_youtube_url) + '" class="dir-video-fallback" target="_blank" rel="noopener" onclick="event.stopPropagation()">' +
          '<img src="' + thumb + '" alt="' + _esc(p.name) + ' video thumbnail">' +
          '<span>▶</span>' +
        '</a>' +
      '</div>';
    }
    return p.image_url
      ? '<div class="' + cls + '" style="background-image:url(' + _esc(p.image_url) + ')"></div>'
      : '<div class="' + cls + ' ' + cls + '--placeholder"></div>';
  }

  function _cardPremium(p) {
    var heroHtml = _coverMediaHtml(p, 'premium');
    return '<article class="dir-card dir-card--premium" data-pid="' + _esc(p.id) + '">' +
      heroHtml +
      '<div class="dir-card-body">' +
        '<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.4rem">' +
          _logoEl(p, 'md') +
          '<div>' +
            '<div class="dir-card-badge">' + catLabel(p.category) + '</div>' +
            '<h3 class="dir-card-name" style="margin:0">' + _esc(p.name) + '</h3>' +
          '</div>' +
        '</div>' +
        (p.short_desc ? '<p class="dir-card-desc">' + _esc(p.short_desc) + '</p>' : '') +
        (p.website_url ? '<a href="' + _esc(p.website_url) + '" target="_blank" rel="noopener" class="dir-website-link" onclick="event.stopPropagation()">🌐 ' + _esc(p.website_url.replace(/^https?:\/\//,'').replace(/\/$/,'')) + '</a>' : '') +
        '<div class="dir-card-btns">' + _btns(p) + '</div>' +
      '</div></article>';
  }

  function _cardFeatured(p) {
    var heroHtml = _coverMediaHtml(p, 'featured');
    return '<article class="dir-feat-card" data-pid="' + _esc(p.id) + '">' +
      heroHtml +
      '<div class="dir-feat-body">' +
        '<div class="dir-feat-cat">' + catLabel(p.category) + '</div>' +
        '<div style="display:flex;align-items:center;gap:0.4rem;margin-bottom:0.25rem">' +
          _logoEl(p, 'sm') +
          '<h3 class="dir-feat-name" style="margin:0">' + _esc(p.name) + '</h3>' +
        '</div>' +
        (p.short_desc ? '<p class="dir-feat-desc">' + _esc(p.short_desc) + '</p>' : '') +
        '<div class="dir-feat-btns">' + _btns(p) + '</div>' +
      '</div></article>';
  }

  function _cardStandard(p) {
    return '<article class="dir-row" data-pid="' + _esc(p.id) + '">' +
      _logoEl(p, 'sm') +
      '<div class="dir-row-main">' +
        '<span class="dir-row-name">' + _esc(p.name) + '</span>' +
        '<span class="dir-row-cat">' + catLabel(p.category) + '</span>' +
        (p.short_desc ? '<span class="dir-row-desc">' + _esc(p.short_desc.substring(0,80)) + '</span>' : '') +
      '</div>' +
      '<div class="dir-row-btns">' + _btns(p) + '</div>' +
    '</article>';
  }

  function _esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    // Set page title
    var titleEl = document.getElementById('dir-title');
    if (titleEl) titleEl.textContent = pageTitle();
    var backBtn = document.getElementById('dir-back');
    if (backBtn) {
      backBtn.textContent = t('back');
      backBtn.addEventListener('click', function () {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage('CLOSE_MODAL', '*');
        } else {
          history.back();
        }
      });
    }

    // Try to inherit municipality from parent window
    try {
      if (window.parent && window.parent._appMunicipality) {
        MUN = window.parent._appMunicipality;
      }
    } catch(e) {}

    // Loading state
    var loading = document.getElementById('dir-loading');
    if (loading) loading.style.display = 'block';

    // Wait for supabase then load
    var tries = 0;
    function poll() {
      if (window.supabaseClient || window.SB) {
        if (loading) loading.style.display = 'none';
        loadPartners();
      } else if (tries++ < 30) {
        setTimeout(poll, 200);
      } else {
        if (loading) loading.style.display = 'none';
        renderAll([]);
      }
    }
    poll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for external use
  window.DirectoryPage = { trackClick: trackClick };
})();
