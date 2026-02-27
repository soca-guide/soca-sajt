/**
 * assets/analytics.js — GA4 tracking (NO Supabase writes)
 *
 * Covers:
 *  1. Tenant dimensions  — sets user_properties on every event
 *  2. Outbound clicks    — tel:, mailto:, external URLs
 *  3. SPA section_view   — patches history.pushState + openModal
 *  4. Dev-mode logging   — console.log only on localhost/127.0.0.1
 */
(function () {
  'use strict';

  var DEV = window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.__DEBUG === true;

  /* ── Helpers ────────────────────────────────────────────────────────────── */
  function _slug() {
    return ((new URLSearchParams(window.location.search).get('t') || '').toLowerCase() || 'direct');
  }

  function _log() {
    if (!DEV) return;
    var args = ['[GA4 📊]'].concat(Array.prototype.slice.call(arguments));
    console.log.apply(console, args);
  }

  /**
   * Central send function — always attaches tenant_slug.
   * Uses optional chaining equivalent for older engines.
   */
  function _send(eventName, params) {
    var p = Object.assign({ tenant_slug: _slug() }, params || {});
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, p);
    }
    _log(eventName, p);
  }

  /* ── 1. Tenant dimensions ────────────────────────────────────────────────
   * Called from app.js → applyTenantOverrides when tenant loads.
   * Sets user_properties so EVERY subsequent GA4 event carries tenant info.
   */
  window.__GA4_TENANT_SET = function (tenantId, tenantSlug, tenantName) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('set', 'user_properties', {
      tenant_slug: tenantSlug || 'direct',
      tenant_name: tenantName || ''
    });
    // Re-fire page_view now that tenant context is known
    window.gtag('event', 'page_view', {
      tenant_slug:  tenantSlug || 'direct',
      tenant_name:  tenantName || '',
      page_title:   document.title
    });
    _log('tenant_set + page_view', { tenantId: tenantId, slug: tenantSlug, name: tenantName });
  };

  /* ── 2. Outbound link tracking ───────────────────────────────────────────
   * Captures clicks on <a href="tel:…">, <a href="mailto:…">,
   * and external <a href="https://other-domain.com/…"> links.
   * useCapture = true to intercept before the browser navigates away.
   */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('a[href]');
    if (!el) return;
    var href = el.getAttribute('href') || '';
    if (!href) return;
    var labelText = (el.textContent || el.title || '').trim().substring(0, 80);

    if (href.startsWith('tel:')) {
      _send('outbound_click', {
        link_type: 'phone',
        link_url:  href,
        link_text: labelText
      });
      return;
    }

    if (href.startsWith('mailto:')) {
      _send('outbound_click', {
        link_type: 'email',
        link_url:  href.replace(/\?.*$/, ''), // strip body/subject params
        link_text: labelText
      });
      return;
    }

    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
      try {
        var u = new URL(href, window.location.href);
        if (u.hostname !== window.location.hostname) {
          _send('outbound_click', {
            link_type:   'external',
            link_domain: u.hostname,
            link_url:    href.substring(0, 200),
            link_text:   labelText
          });
        }
      } catch (err) { /* malformed URL — skip */ }
    }
  }, true /* useCapture */);

  /* ── 3a. SPA section_view via history.pushState patch ───────────────────
   * Every panel open (parking, adrenalin, attractions, etc.) calls
   * history.pushState({ overlay: 'section-name' }, …).
   * We intercept that to fire section_view without modifying each function.
   */
  var _origPushState = history.pushState.bind(history);
  history.pushState = function (state, title, url) {
    _origPushState(state, title, url);
    if (state && state.overlay) {
      _send('section_view', {
        section:   state.overlay,
        page_path: typeof url === 'string' ? url : window.location.pathname
      });
    }
    // Modal opens (state.__appModal) are handled in modals.js → openModal()
  };

  /* ── 3b. Main-menu card tracking ─────────────────────────────────────────
   * The .menu-grid card_click listener already exists in index.html.
   * We enrich it with section names via the global SECTION_ID_MAP.
   */
  window.__GA4_SECTION_MAP = {
    'openSocaLive':         'soca_live',
    'openRezervisiPonovo':  'rezervisi_ponovo',
    'openLostFound':        'lost_found',
    'openRestavracije':     'restavracije',
    'attractions-card':     'attractions',
    'daily-essentials-card':'daily_essentials',
    'taxi-bus-card':        'taxi_bus',
    'adrenalin-card':       'adrenalin',
    'maintenance-card':     'maintenance',
    'parking-card':         'parking',
    'trip-ideas-card':      'trip_ideas',
    'openSocaLiveCard':     'soca_live'
  };

  /* ── Dev-mode summary ────────────────────────────────────────────────────*/
  if (DEV) {
    console.groupCollapsed('[GA4 📊] Analytics loaded — DEV mode');
    console.log('Measurement ID : G-8B48GQC9F3');
    console.log('Tenant slug    :', _slug());
    console.log('Tracking       : outbound_click, section_view, tenant page_view');
    console.log('Tip: Check Network tab → googletagmanager.com to confirm events.');
    console.groupEnd();
  }
})();
