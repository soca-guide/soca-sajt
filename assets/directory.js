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
    // activities
    rafting:     { sl:'Rafting',      en:'Rafting',     de:'Rafting',    it:'Rafting',    pl:'Rafting',       cs:'Rafting' },
    paragliding: { sl:'Paragliding',  en:'Paragliding', de:'Paragliding',it:'Parapendio', pl:'Paralotniarstwo',cs:'Paragliding' },
    kayak:       { sl:'Kajak',        en:'Kayak',       de:'Kajak',      it:'Kayak',      pl:'Kajak',          cs:'Kajak' },
    canyoning:   { sl:'Kanjoning',    en:'Canyoning',   de:'Canyoning',  it:'Canyoning',  pl:'Kanjoning',      cs:'Canyoning' },
    hiking:      { sl:'Planinarenje', en:'Hiking',      de:'Wandern',    it:'Escursionismo',pl:'Piesze wycieczki',cs:'Turistika' },
    cycling:     { sl:'Kolesarjenje', en:'Cycling',     de:'Radfahren',  it:'Ciclismo',   pl:'Kolarstwo',      cs:'Cyklistika' },
    climbing:    { sl:'Plezanje',     en:'Climbing',    de:'Klettern',   it:'Arrampicata',pl:'Wspinaczka',      cs:'Lezení' },
    zipline:     { sl:'Zipline',      en:'Zipline',     de:'Zipline',    it:'Zipline',    pl:'Zipline',         cs:'Zipline' },
    other_act:   { sl:'Ostalo',       en:'Other',       de:'Sonstiges',  it:'Altro',      pl:'Inne',            cs:'Jiné' },
    // food
    restaurant:  { sl:'Restavracija', en:'Restaurant',  de:'Restaurant', it:'Ristorante', pl:'Restauracja',     cs:'Restaurace' },
    gostilna:    { sl:'Gostilna',     en:'Inn',         de:'Gasthaus',   it:'Locanda',    pl:'Gospoda',         cs:'Hostinec' },
    cafe:        { sl:'Kavarna',      en:'Café',        de:'Café',       it:'Caffè',      pl:'Kawiarnia',       cs:'Kavárna' },
    pizzeria:    { sl:'Pizzerija',    en:'Pizzeria',    de:'Pizzeria',   it:'Pizzeria',   pl:'Pizzeria',         cs:'Pizzerie' },
    bar:         { sl:'Bar',          en:'Bar',         de:'Bar',        it:'Bar',        pl:'Bar',              cs:'Bar' },
    bistro:      { sl:'Bistro',       en:'Bistro',      de:'Bistro',     it:'Bistro',     pl:'Bistro',           cs:'Bistro' },
    brewery:     { sl:'Pivovarna',    en:'Brewery',     de:'Brauerei',   it:'Birrificio', pl:'Browar',           cs:'Pivovar' },
    street_food: { sl:'Street food',  en:'Street food', de:'Street food',it:'Street food',pl:'Street food',      cs:'Street food' },
    other_food:  { sl:'Ostalo',       en:'Other',       de:'Sonstiges',  it:'Altro',      pl:'Inne',             cs:'Jiné' },
    // taxi
    taxi:        { sl:'Taxi',         en:'Taxi',        de:'Taxi',       it:'Taxi',       pl:'Taxi',             cs:'Taxi' },
    transfer:    { sl:'Transfer',     en:'Transfer',    de:'Transfer',   it:'Transfer',   pl:'Transfer',         cs:'Transfer' },
    bus:         { sl:'Bus',          en:'Bus',         de:'Bus',        it:'Bus',        pl:'Bus',              cs:'Bus' },
    other_taxi:  { sl:'Ostalo',       en:'Other',       de:'Sonstiges',  it:'Altro',      pl:'Inne',             cs:'Jiné' }
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
      sl:'Taxi & Bus',             en:'Taxi & Bus',              de:'Taxi & Bus',
      it:'Taxi & Bus',             pl:'Taxi & Bus',              cs:'Taxi & Bus'
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
  var SESSION_ID  = _getOrCreateSession();
  var PAGE_PATH   = window.location.pathname;
  var ALL_PARTNERS = [];
  var currentFilter = 'all';
  var _trackQueue   = [];
  var _trackTimer   = null;
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

  // ── Session ID ────────────────────────────────────────────────────────────
  function _getOrCreateSession() {
    var key = 'dir_session_id';
    var s = localStorage.getItem(key);
    if (!s) {
      s = 'sid_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(key, s);
    }
    return s;
  }

  // ── Tracking ──────────────────────────────────────────────────────────────
  function _impressionKey(partnerId) {
    return SESSION_ID + '|' + partnerId + '|' + PAGE_PATH + '|' + currentFilter;
  }

  function trackImpression(partner) {
    var key = _impressionKey(partner.id);
    if (_impressionsSent[key]) return; // de-dup
    _impressionsSent[key] = true;
    _enqueue({
      partner_id:        partner.id,
      municipality_slug: MUN,
      type:              partner.type,
      category:          partner.category,
      tier:              partner.tier,
      event_name:        'impression',
      session_id:        SESSION_ID,
      page_path:         PAGE_PATH,
      user_agent:        navigator.userAgent.substring(0, 200)
    });
  }

  function trackClick(partner, eventName, filterValue) {
    _enqueue({
      partner_id:        partner.id,
      municipality_slug: MUN,
      type:              partner.type,
      category:          partner.category,
      tier:              partner.tier,
      event_name:        eventName,
      filter_value:      filterValue || null,
      session_id:        SESSION_ID,
      page_path:         PAGE_PATH,
      referrer:          document.referrer.substring(0, 200)
    });
    _flushNow(); // clicks flush immediately
  }

  function _enqueue(event) {
    _trackQueue.push(event);
    clearTimeout(_trackTimer);
    _trackTimer = setTimeout(_flushNow, 2000); // batch within 2s
  }

  function _flushNow() {
    if (!_trackQueue.length) return;
    var batch = _trackQueue.splice(0);
    var sb = window.supabaseClient || window.SB;
    if (!sb) return;
    Promise.resolve(sb.rpc('track_partner_events', { events: batch })).catch(function () {});
  }

  // Flush on page hide
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') _flushNow();
  });
  window.addEventListener('pagehide', _flushNow);

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

  function _renderSections(partners) {
    var tiers = ['premium', 'featured', 'standard'];
    tiers.forEach(function (tier) {
      var group = partners.filter(function (p) { return p.tier === tier; });
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

  function _cardPremium(p) {
    var heroHtml = p.image_url
      ? '<div class="dir-card-img" style="background-image:url(' + _esc(p.image_url) + ')"></div>'
      : '<div class="dir-card-img dir-card-img--placeholder"></div>';
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
    var heroHtml = p.image_url
      ? '<div class="dir-feat-img" style="background-image:url(' + _esc(p.image_url) + ')"></div>'
      : '<div class="dir-feat-img dir-feat-img--placeholder"></div>';
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
