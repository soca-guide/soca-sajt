(function () {
  'use strict';

  window.TenantLoader = window.TenantLoader || {};

  // ── sessionStorage cache ──────────────────────────────────────────────────────
  var _CACHE_TTL    = 300000; // 5 minutes in ms
  var _CACHE_PREFIX = 'tenantOv:';

  function _readCache(slug) {
    try {
      var raw = sessionStorage.getItem(_CACHE_PREFIX + slug);
      if (!raw) return null;
      var entry = JSON.parse(raw);
      if (!entry || (Date.now() - entry.ts) > _CACHE_TTL) return null;
      return entry.ov; // already has __health attached from write time
    } catch (e) { return null; }
  }

  function _writeCache(slug, ov) {
    try {
      sessionStorage.setItem(_CACHE_PREFIX + slug, JSON.stringify({ ts: Date.now(), ov: ov }));
    } catch (e) {}
  }

  // ── _errOv — builds a safe error payload (never null, callers can read __health) ──
  function _errOv(slug, reason) {
    return {
      tenant_id: null, slug: slug,
      config: null, parkingRecommended: null, houseRulesPrivate: null,
      __health: { ok: false, reason: reason, tenant_id: null, items_count: 0, cached: false, ts: Date.now() }
    };
  }

  // ── getTenantSlug ─────────────────────────────────────────────────────────────
  // Reads ?t=<slug> from the URL and returns a sanitised slug or null.
  window.TenantLoader.getTenantSlug = function () {
    try {
      var raw = new URLSearchParams(window.location.search).get('t') || '';
      var slug = raw.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
      return slug || null;
    } catch (e) {
      return null;
    }
  };

  // ── waitForSB ─────────────────────────────────────────────────────────────────
  // Polls until window.SB is set (by supabase-client.js) or timeout elapses.
  function waitForSB(timeoutMs) {
    return new Promise(function (resolve) {
      if (window.SB) { resolve(window.SB); return; }
      var elapsed = 0;
      var iv = setInterval(function () {
        elapsed += 100;
        if (window.SB) { clearInterval(iv); resolve(window.SB); }
        else if (elapsed >= timeoutMs) { clearInterval(iv); resolve(null); }
      }, 100);
    });
  }

  // ── loadOverrides ─────────────────────────────────────────────────────────────
  // Fetches tenant config + item overrides from Supabase.
  // Returns a Promise that resolves to:
  //   { tenant_id, slug, config, parkingRecommended, houseRulesPrivate }
  // or null on any error / missing data (guest site keeps working normally).
  window.TenantLoader.loadOverrides = function (slug) {
    if (!slug) return Promise.resolve(null);

    // Return cached result immediately if still fresh
    var _cached = _readCache(slug);
    if (_cached) {
      _cached.__health.cached = true;
      return Promise.resolve(_cached);
    }

    return waitForSB(6000)
      .then(function (sb) {
        if (!sb) return _errOv(slug, 'NO_SB');

        // Step 1 — resolve tenant_id
        return sb.from('tenants')
          .select('tenant_id')
          .eq('slug', slug)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle()
          .then(function (r1) {
            if (r1.error || !r1.data) return _errOv(slug, 'TENANT_NOT_FOUND');
            var tenantId = r1.data.tenant_id;

            // Step 2 — fetch items for this tenant and global rows (tenant_id IS NULL)
            // Merge priority: tenant row > global (null) row
            return sb.from('items')
              .select('tenant_id, section_key, item_key, data_json')
              .in('item_key', ['default_config', 'parking_recommended', 'house_rules_private'])
              .eq('visible', true)
              .or('tenant_id.is.null,tenant_id.eq.' + tenantId)
              .then(function (r2) {
                if (r2.error) return _errOv(slug, 'ERROR');

                // Step 3 — merge: prefer tenant row when both exist
                var merged = {};
                (r2.data || []).forEach(function (row) {
                  var k = row.section_key + '/' + row.item_key;
                  if (!merged[k] || row.tenant_id === tenantId) {
                    merged[k] = row.data_json;
                  }
                });

                var itemsCount = (r2.data || []).length;
                var ov = {
                  tenant_id:          tenantId,
                  slug:               slug,
                  config:             merged['info/default_config']              || null,
                  parkingRecommended: merged['parking/parking_recommended']      || null,
                  houseRulesPrivate:  merged['house_rules/house_rules_private']  || null,
                  __health: {
                    ok:         true,
                    reason:     itemsCount > 0 ? 'OK' : 'ITEMS_EMPTY',
                    tenant_id:  tenantId,
                    items_count: itemsCount,
                    cached:     false,
                    ts:         Date.now()
                  }
                };

                // Cache the successful result for 5 min
                _writeCache(slug, ov);
                return ov;
              });
          });
      })
      .catch(function () { return _errOv(slug, 'ERROR'); }); // never break the guest site
  };

})();
