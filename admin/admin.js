(function () {
  'use strict';

  // ── Supabase client (initialised by assets/supabase-client.js) ───────────────
  var sb = window.supabaseClient || null;

  // ── HTML escape helper ────────────────────────────────────────────────────────
  function _esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  if (!sb || typeof sb.from !== 'function') {
    // Surface a visible error instead of crashing silently
    document.body.innerHTML =
      '<div style="padding:2rem;font-family:sans-serif;color:#f87171;background:#0a1612;min-height:100vh">' +
      '<h2>Supabase client nije inicijalizovan.</h2>' +
      '<p>Provjeri internet vezu i ponovo učitaj stranicu.</p>' +
      '</div>';
    return;
  }

  // ── DOM refs ─────────────────────────────────────────────────────────────────
  var viewLogin     = document.getElementById('view-login');
  var viewDashboard = document.getElementById('view-dashboard');
  var loginError    = document.getElementById('login-error');
  var inputEmail    = document.getElementById('input-email');
  var inputPassword = document.getElementById('input-password');
  var btnLogin      = document.getElementById('btn-login');
  var btnLogout     = document.getElementById('btn-logout');
  var dashEmail     = document.getElementById('dash-email');
  var dashRole      = document.getElementById('dash-role');
  var dashTenant    = document.getElementById('dash-tenant');
  var dashStatus    = document.getElementById('dash-status');

  // Master panel refs
  var masterPanel          = document.getElementById('master-panel');
  var ownerPanel           = document.getElementById('owner-panel');
  var btnRefreshTenants    = document.getElementById('btn-refresh-tenants');
  var tenantsStatus        = document.getElementById('tenants-status');
  var tenantsTbody         = document.getElementById('tenants-tbody');
  var tenantNameInput      = document.getElementById('tenant-name');
  var tenantSlugInput      = document.getElementById('tenant-slug');
  var createTenantStatus   = document.getElementById('create-tenant-status');
  var btnCreateTenant      = document.getElementById('btn-create-tenant');
  var ownerEmailInput      = document.getElementById('owner-email');
  var ownerUserIdInput     = document.getElementById('owner-user-id');
  var ownerTenantSelect    = document.getElementById('owner-tenant-select');
  var linkOwnerStatus      = document.getElementById('link-owner-status');
  var btnLinkOwner         = document.getElementById('btn-link-owner');

  // Owner panel refs
  var ownerCallPhoneInput      = document.getElementById('owner-call-phone');
  var ownerDirectionsLinkInput = document.getElementById('owner-directions-link');
  var ownerRulesUrlInput       = document.getElementById('owner-rules-url');
  var ownerRulesTextArea       = document.getElementById('owner-rules-text');
  var ownerParkingTitleInput   = document.getElementById('owner-parking-title');
  var ownerParkingAddressInput = document.getElementById('owner-parking-address');
  var ownerParkingMapsInput    = document.getElementById('owner-parking-maps');
  var ownerParkingNotesArea    = document.getElementById('owner-parking-notes');
  var ownerSaveStatus          = document.getElementById('owner-save-status');
  var btnOwnerSave             = document.getElementById('btn-owner-save');

  // Rebook refs
  var ownerRebookNameInput        = document.getElementById('owner-rebook-name');
  var ownerRebookPhoneInput       = document.getElementById('owner-rebook-phone');
  var ownerRebookEmailInput       = document.getElementById('owner-rebook-email');
  var ownerRebookLinkInput        = document.getElementById('owner-rebook-link');
  var ownerMaintVisibleChk        = document.getElementById('owner-maint-visible');
  var ownerMaintEmailInput        = document.getElementById('owner-maint-email');
  var ownerMaintW3fInput          = document.getElementById('owner-maint-w3f');
  var ownerRebookInstructionsArea = document.getElementById('owner-rebook-instructions');

  // Master editor refs (Global + Tenant)
  var homeCardsEditor              = document.getElementById('home-cards-editor');
  var globalSaveStatus             = document.getElementById('global-save-status');
  var btnGlobalSave                = document.getElementById('btn-global-save');
  var analyticsOutput              = document.getElementById('analytics-output');
  var munFilterSelect              = document.getElementById('mun-filter-select');
  var analyticsStatus              = document.getElementById('analytics-status');
  var btnRefreshAnalytics          = document.getElementById('btn-refresh-analytics');
  var masterTenantSelect           = document.getElementById('master-tenant-select');
  var btnMasterLoad                = document.getElementById('btn-master-load');
  var masterSaveStatus             = document.getElementById('master-save-status');
  var masterTenantFields           = document.getElementById('master-tenant-fields');
  var masterCallPhoneInput         = document.getElementById('master-call-phone');
  var masterDirectionsLinkInput    = document.getElementById('master-directions-link');
  var masterRulesUrlInput          = document.getElementById('master-rules-url');
  var masterRulesTextArea          = document.getElementById('master-rules-text');
  var masterParkingTitleInput      = document.getElementById('master-parking-title');
  var masterParkingAddressInput    = document.getElementById('master-parking-address');
  var masterParkingMapsInput       = document.getElementById('master-parking-maps');
  var masterParkingNotesArea       = document.getElementById('master-parking-notes');
  var masterRebookNameInput        = document.getElementById('master-rebook-name');
  var masterRebookPhoneInput       = document.getElementById('master-rebook-phone');
  var masterRebookEmailInput       = document.getElementById('master-rebook-email');
  var masterRebookLinkInput        = document.getElementById('master-rebook-link');
  var masterRebookInstructionsArea = document.getElementById('master-rebook-instructions');
  var masterMaintVisibleChk        = document.getElementById('master-maint-visible');
  var masterMaintEmailInput        = document.getElementById('master-maint-email');
  var masterMaintW3fInput          = document.getElementById('master-maint-w3f');
  var btnMasterSave                = document.getElementById('btn-master-save');

  // Quick-add refs
  var quickSocaIdInput    = document.getElementById('quick-soca-id');
  var quickOwnerEmailInput = document.getElementById('quick-owner-email');
  var quickLocationInput  = document.getElementById('quick-location');
  var btnQuickInvite      = document.getElementById('btn-quick-invite');

  // Table search + filter refs
  var tenantsSearch       = document.getElementById('tenants-search');
  var tenantsFilterStatus = document.getElementById('tenants-filter-status');
  // Master editor header refs
  var meditorSocaId = document.getElementById('meditor-soca-id');
  var meditorName   = document.getElementById('meditor-name');
  var meditorSlug   = document.getElementById('meditor-slug');
  var meditorOwner  = document.getElementById('meditor-owner');
  var meditorStatus = document.getElementById('meditor-status');

  // All tenants cache (for client-side search/filter)
  var _allTenants = [];

  // ── Slug helper ──────────────────────────────────────────────────────────────
  var DIACRITIC_MAP = {
    'č':'c','ć':'c','š':'s','ž':'z','đ':'d',
    'Č':'c','Ć':'c','Š':'s','Ž':'z','Đ':'d',
    'á':'a','à':'a','â':'a','ä':'a','ã':'a',
    'é':'e','è':'e','ê':'e','ë':'e',
    'í':'i','ì':'i','î':'i','ï':'i',
    'ó':'o','ò':'o','ô':'o','ö':'o','õ':'o',
    'ú':'u','ù':'u','û':'u','ü':'u',
    'ý':'y','ñ':'n'
  };

  function slugify(str) {
    return str
      .split('').map(function(c) { return DIACRITIC_MAP[c] || c; }).join('')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // ── Status helpers for sub-sections ──────────────────────────────────────────
  function setStatus(el, msg, type) {
    el.textContent = msg;
    el.className = 'msg ' + (type || 'info');
  }
  function clearStatus(el) { el.className = 'msg hidden'; }

  // ── MASTER: Load tenants ──────────────────────────────────────────────────────
  function loadTenants() {
    setStatus(tenantsStatus, 'Učitavam tenante…', 'info');

    sb.from('tenants')
      .select('tenant_id, external_id, slug, name, status')
      .order('created_at', { ascending: false })
      .then(function (result) {
        if (result.error) {
          setStatus(tenantsStatus, 'Greška: ' + result.error.message, 'error');
          return;
        }

        clearStatus(tenantsStatus);
        var rows = result.data || [];

        // Rebuild tenant selects (preserve blank first option)
        ownerTenantSelect.innerHTML  = '<option value="">— izaberi tenant —</option>';
        masterTenantSelect.innerHTML = '<option value="">— izaberi tenant —</option>';

        rows.forEach(function (t) {
          var opt = document.createElement('option');
          opt.value = t.tenant_id;
          opt.textContent = t.name + ' (' + t.slug + ')';
          ownerTenantSelect.appendChild(opt);

          var opt2 = document.createElement('option');
          opt2.value = t.tenant_id;
          opt2.textContent = t.name + ' (' + t.slug + ')';
          masterTenantSelect.appendChild(opt2);
        });

        if (rows.length === 0) {
          _allTenants = [];
          renderTenantsTable();
          return;
        }

        var tenantIds = rows.map(function (t) { return t.tenant_id; });

        // Try to get owner identity from user_profiles (email column may or may not exist — guard)
        sb.from('user_profiles')
          .select('*')
          .in('tenant_id', tenantIds)
          .eq('role', 'OWNER')
          .then(function (r2) {
            var emailMap = {};
            try {
              (r2.data || []).forEach(function (p) {
                if (p.tenant_id) {
                  emailMap[p.tenant_id] = p.email || p.user_email || '—';
                }
              });
            } catch (e) {}

            _allTenants = rows.map(function (t) {
              return {
                tenant_id:  t.tenant_id,
                external_id: t.external_id || '',
                name:       t.name,
                slug:       t.slug,
                status:     t.status || '',
                ownerEmail: emailMap[t.tenant_id] || '—'
              };
            });
            renderTenantsTable();
          })
          .catch(function () {
            _allTenants = rows.map(function (t) {
              return {
                tenant_id:  t.tenant_id,
                external_id: t.external_id || '',
                name:       t.name,
                slug:       t.slug,
                status:     t.status || '',
                ownerEmail: '—'
              };
            });
            renderTenantsTable();
          });
      });
  }

  // ── MASTER: Render tenants table (client-side filter) ─────────────────────────
  function renderTenantsTable() {
    var q     = tenantsSearch.value.toLowerCase();
    var stFlt = tenantsFilterStatus.value;

    var filtered = _allTenants.filter(function (t) {
      if (stFlt && t.status !== stFlt) return false;
      if (q) {
        var hay = [t.external_id, t.name, t.slug, t.ownerEmail].join(' ').toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      tenantsTbody.innerHTML = '<tr><td colspan="6" class="table-empty">Nema rezultata.</td></tr>';
      return;
    }

    // Build absolute guest URL: we're at /admin/, guest site is one level up
    var baseUrl = window.location.origin +
      window.location.pathname.replace(/\/admin\/[^/]*$/, '');

    tenantsTbody.innerHTML = filtered.map(function (t) {
      var guestUrl  = baseUrl + '/index.html?t=' + encodeURIComponent(t.slug);
      var isActive  = t.status === 'active';
      var toggleLbl = isActive ? 'Isključi' : 'Aktiviraj';
      var toggleSt  = isActive ? 'inactive' : 'active';
      var statusClr = isActive ? '#4ade80' : '#f87171';

      return '<tr>' +
        '<td class="mono">'  + esc(t.external_id || '—') + '</td>' +
        '<td>'               + esc(t.name)                + '</td>' +
        '<td>'               + esc(t.slug)                + '</td>' +
        '<td style="color:' + statusClr + ';font-weight:600">' + esc(t.status) + '</td>' +
        '<td>'               + esc(t.ownerEmail)          + '</td>' +
        '<td style="white-space:nowrap;display:flex;gap:4px;flex-wrap:wrap">' +
          '<a href="' + esc(guestUrl) + '" target="_blank" rel="noopener" ' +
             'style="display:inline-block;padding:2px 8px;border-radius:4px;' +
                    'background:#1e3a2a;color:#4ade80;font-size:0.75rem;text-decoration:none">Otvori</a>' +
          '<a href="../admin/" target="_blank" rel="noopener" ' +
             'style="display:inline-block;padding:2px 8px;border-radius:4px;' +
                    'background:#1a2a3a;color:#93c5fd;font-size:0.75rem;text-decoration:none">Admin</a>' +
          '<button class="btn-sm btn-copy-link" data-url="' + esc(guestUrl) + '">Kopiraj</button>' +
          '<button class="btn-sm btn-edit-tenant"' +
            ' data-tid="'    + esc(t.tenant_id)   + '"' +
            ' data-ext="'    + esc(t.external_id) + '"' +
            ' data-name="'   + esc(t.name)        + '"' +
            ' data-slug="'   + esc(t.slug)        + '"' +
            ' data-owner="'  + esc(t.ownerEmail)  + '"' +
            ' data-status="' + esc(t.status)      + '"' +
            '>Uredi</button>' +
          '<button class="btn-sm btn-toggle-status"' +
            ' data-tid="'        + esc(t.tenant_id) + '"' +
            ' data-new-status="' + toggleSt         + '"' +
            ' style="color:' + (isActive ? '#f87171' : '#4ade80') + '"' +
            '>' + toggleLbl + '</button>' +
          (t.ownerEmail && t.ownerEmail !== '—'
            ? '<button class="btn-sm btn-magic-link"' +
                ' data-email="' + esc(t.ownerEmail) + '"' +
                ' data-tid="'   + esc(t.tenant_id)  + '"' +
                ' data-slug="'  + esc(t.slug)        + '"' +
                '>Login link</button>' +
              '<button class="btn-sm btn-detach-owner"' +
                ' data-tid="'  + esc(t.tenant_id)  + '"' +
                ' style="color:#f87171"' +
                '>Ukloni vlasnika</button>'
            : '') +
          '<button class="btn-sm btn-delete-tenant"' +
            ' data-tid="'  + esc(t.tenant_id) + '"' +
            ' data-name="' + esc(t.name)      + '"' +
            ' style="color:#f87171;font-weight:700"' +
            '>Obriši</button>' +
        '</td>' +
        '</tr>';
    }).join('');
  }

  // ── MASTER: Toggle tenant status (via edge function so owner disable is reliable) ──
  function toggleTenantStatus(tenantId, newStatus, btn) {
    btn.disabled = true;
    sb.functions.invoke('master_admin', {
      body: { action: 'set_status', tenant_id: tenantId, status: newStatus }
    }).then(function (r) {
      btn.disabled = false;
      if (r.error) {
        setStatus(tenantsStatus,
          'Greška pri promeni statusa: ' + (r.error.message || JSON.stringify(r.error)), 'error');
        return;
      }
      // Update local cache and re-render (no full reload)
      _allTenants.forEach(function (t) {
        if (t.tenant_id === tenantId) t.status = newStatus;
      });
      renderTenantsTable();
    }).catch(function (err) {
      btn.disabled = false;
      setStatus(tenantsStatus, 'Greška: ' + (err && err.message || '?'), 'error');
    });
  }

  // ── MASTER: Send magic login link to owner ────────────────────────────────────
  function sendMagicLink(tenantId, tenantSlug, ownerEmail, btn) {
    btn.disabled    = true;
    btn.textContent = 'Šaljem…';
    sb.functions.invoke('master_admin', {
      body: { action: 'invite_owner', owner_email: ownerEmail, tenant_id: tenantId, tenant_slug: tenantSlug }
    }).then(function (r) {
      btn.disabled = false;
      if (r.error) {
        btn.textContent = 'Greška!';
        setStatus(tenantsStatus,
          'Greška pri slanju login linka: ' +
          (r.error.message || JSON.stringify(r.error)), 'error');
      } else {
        btn.textContent = 'Poslato! ✓';
        setTimeout(function () { btn.textContent = 'Login link'; }, 3000);
      }
    }).catch(function (err) {
      btn.disabled    = false;
      btn.textContent = 'Greška!';
      setStatus(tenantsStatus,
        'Greška: ' + (err && err.message || '?'), 'error');
    });
  }

  // ── MASTER: Detach (remove) owner from a tenant ──────────────────────────────
  function detachOwner(tenantId, btn) {
    if (!confirm('Ukloniti vlasnika iz ovog apartmana?\n(user_profiles i dozvole za ovaj tenant biće obrisani.)')) return;
    btn.disabled    = true;
    btn.textContent = 'Uklanijam…';
    sb.functions.invoke('master_admin', {
      body: { action: 'detach_owner', tenant_id: tenantId }
    }).then(function (r) {
      btn.disabled    = false;
      btn.textContent = 'Ukloni vlasnika';
      if (r.error) {
        setStatus(tenantsStatus,
          'Greška pri uklanjanju vlasnika: ' + (r.error.message || JSON.stringify(r.error)), 'error');
        return;
      }
      // Clear owner email from local cache and re-render
      _allTenants.forEach(function (t) {
        if (t.tenant_id === tenantId) t.ownerEmail = '—';
      });
      renderTenantsTable();
    }).catch(function (err) {
      btn.disabled    = false;
      btn.textContent = 'Ukloni vlasnika';
      setStatus(tenantsStatus, 'Greška: ' + (err && err.message || '?'), 'error');
    });
  }

  // ── MASTER: Delete tenant + all its data ──────────────────────────────────────
  function deleteTenant(tenantId, tenantName, btn) {
    if (!confirm('OBRIŠI tenant "' + tenantName + '" + sve podatke?\n\nOva akcija je nepovratna!')) return;
    btn.disabled    = true;
    btn.textContent = 'Brišem…';
    sb.functions.invoke('master_admin', {
      body: { action: 'delete_tenant', tenant_id: tenantId }
    }).then(function (r) {
      btn.disabled    = false;
      btn.textContent = 'Obriši';
      if (r.error) {
        setStatus(tenantsStatus,
          'Greška pri brisanju tenanta: ' + (r.error.message || JSON.stringify(r.error)), 'error');
        return;
      }
      // Remove from local cache and re-render
      _allTenants = _allTenants.filter(function (t) { return t.tenant_id !== tenantId; });
      renderTenantsTable();
      setStatus(tenantsStatus, 'Tenant "' + tenantName + '" obrisan. ✓', 'info');
    }).catch(function (err) {
      btn.disabled    = false;
      btn.textContent = 'Obriši';
      setStatus(tenantsStatus, 'Greška: ' + (err && err.message || '?'), 'error');
    });
  }

  // ── MASTER: Export tenant items as JSON ──────────────────────────────────────
  function exportTenantJson() {
    var tenantId = masterTenantSelect.value;
    if (!tenantId) {
      alert('Najpre izaberi tenant iz padajućeg menija (sekcija "TENANT").');
      return;
    }
    var meta = {};
    _allTenants.forEach(function (t) { if (t.tenant_id === tenantId) meta = t; });
    sb.from('items')
      .select('section_key, item_key, data_json, visible')
      .eq('tenant_id', tenantId)
      .then(function (r) {
        if (r.error) { alert('Greška pri exportu: ' + r.error.message); return; }
        var payload = { tenant: meta, items: r.data || [] };
        var blob = new Blob([JSON.stringify(payload, null, 2)],
          { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'tenant-' + (meta.slug || tenantId) + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      });
  }

  // ── MASTER: Export all tenants summary as JSON + CSV ─────────────────────────
  function exportAllTenants() {
    if (!_allTenants.length) {
      alert('Lista tenanta je prazna — prvo osveži.');
      return;
    }
    // JSON download
    var jsonBlob = new Blob([JSON.stringify(_allTenants, null, 2)],
      { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(jsonBlob);
    a.download = 'all-tenants.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    // CSV download
    var header = 'soca_id,slug,name,status,owner_email';
    var rows = _allTenants.map(function (t) {
      return [t.external_id, t.slug, t.name, t.status, t.ownerEmail]
        .map(function (v) {
          return '"' + String(v || '').replace(/"/g, '""') + '"';
        }).join(',');
    });
    var csvBlob = new Blob([[header].concat(rows).join('\n')],
      { type: 'text/csv' });
    var b = document.createElement('a');
    b.href = URL.createObjectURL(csvBlob);
    b.download = 'all-tenants.csv';
    document.body.appendChild(b);
    b.click();
    document.body.removeChild(b);
    URL.revokeObjectURL(b.href);
  }

  // ── MASTER: Open editor for a specific tenant ─────────────────────────────────
  function openMasterEditor(tenantId, meta) {
    // Populate header info bar
    meditorSocaId.textContent = meta.external_id || '—';
    meditorName.textContent   = meta.name || '—';
    meditorSlug.textContent   = meta.slug ? '(' + meta.slug + ')' : '';
    meditorOwner.textContent  = meta.ownerEmail || '—';
    meditorStatus.textContent = meta.status || '—';

    // Sync the select (best-effort)
    masterTenantSelect.value = tenantId;

    _masterTenantId    = tenantId;
    _masterConfigCache = {};
    masterTenantFields.classList.add('hidden');
    setStatus(masterSaveStatus, 'Učitavam…', 'info');

    sb.from('items')
      .select('section_key, item_key, data_json')
      .eq('tenant_id', tenantId)
      .in('item_key', ['default_config', 'house_rules_private', 'parking_recommended', 'rebook'])
      .then(function (result) {
        if (result.error) {
          setStatus(masterSaveStatus, 'Greška: ' + result.error.message, 'error');
          return;
        }

        var byKey = {};
        (result.data || []).forEach(function (r) { byKey[r.item_key] = r.data_json || {}; });

        var cfg = byKey['default_config'] || {};
        _masterConfigCache = cfg;
        masterCallPhoneInput.value      = cfg.quick_call_phone      || cfg.host_phone || '';
        masterDirectionsLinkInput.value = cfg.quick_directions_link || cfg.maps_link  || '';
        masterRulesUrlInput.value       = cfg.quick_rules_url       || './pravila/index.html';

        var rules = byKey['house_rules_private'] || {};
        masterRulesTextArea.value = rules.text || '';

        var park = byKey['parking_recommended'] || {};
        masterParkingTitleInput.value   = park.title    || '';
        masterParkingAddressInput.value = park.address  || '';
        masterParkingMapsInput.value    = park.mapsLink || '';
        masterParkingNotesArea.value    = park.notes    || '';

        var rebook = byKey['rebook'] || {};
        masterRebookNameInput.value        = rebook.apartment_name || '';
        masterRebookPhoneInput.value       = rebook.owner_phone    || '';
        masterRebookEmailInput.value       = rebook.owner_email    || '';
        masterRebookLinkInput.value        = rebook.rebook_link    || '';
        masterRebookInstructionsArea.value = rebook.instructions   || '';

        var maint = byKey['maintenance_config'] || {};
        if (masterMaintVisibleChk) masterMaintVisibleChk.checked = maint.visible !== false;
        if (masterMaintEmailInput) masterMaintEmailInput.value   = maint.email   || '';
        if (masterMaintW3fInput)   masterMaintW3fInput.value     = maint.w3f_key || '';

        masterTenantFields.classList.remove('hidden');
        clearStatus(masterSaveStatus);

        // Scroll to editor
        masterTenantFields.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
  }

  function esc(str) {
    return String(str || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── MASTER: Seed default items for a newly created tenant ────────────────────
  function seedDefaultItems(tenantId, name) {
    var now = new Date().toISOString();
    var defaults = [
      { sk: 'info',        ik: 'default_config',      t: 'config',  dj: { apartment_name: name, quick_rules_url: './pravila/index.html' } },
      { sk: 'house_rules', ik: 'house_rules_private',  t: 'rules',   dj: { text: '' } },
      { sk: 'parking',     ik: 'parking_recommended',  t: 'parking', dj: { title: '', address: '', mapsLink: '', notes: '' } },
      { sk: 'booking',     ik: 'rebook',               t: 'config',  dj: { apartment_name: name, owner_phone: '', owner_email: '', rebook_link: '', instructions: '' } }
    ];
    return Promise.all(defaults.map(function (d) {
      return sb.from('items').insert({
        tenant_id: tenantId, section_key: d.sk, item_key: d.ik,
        type: d.t, order: 0, visible: true, data_json: d.dj, updated_at: now
      });
    }));
  }

  // ── MASTER: Quick-add tenant (create + optionally invite owner) ───────────────
  function quickAddTenant(sendInvite) {
    var name     = tenantNameInput.value.trim();
    var slug     = tenantSlugInput.value.trim();
    var socaId   = quickSocaIdInput   ? quickSocaIdInput.value.trim()   : '';
    var email    = quickOwnerEmailInput ? quickOwnerEmailInput.value.trim() : '';

    if (!name || !slug) {
      setStatus(createTenantStatus, 'Unesite naziv i slug.', 'error');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setStatus(createTenantStatus, 'Slug sme da sadrži samo mala slova, cifre i crtice.', 'error');
      return;
    }
    if (sendInvite && !email) {
      setStatus(createTenantStatus, 'E-mail vlasnika je obavezan za slanje pozivnice.', 'error');
      return;
    }
    if (email && email.indexOf('@') < 0) {
      setStatus(createTenantStatus, 'E-mail vlasnika nije validan.', 'error');
      return;
    }

    btnCreateTenant.disabled = true;
    if (btnQuickInvite) btnQuickInvite.disabled = true;
    setStatus(createTenantStatus, 'Kreiram apartman…', 'info');

    var newId = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0;
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });

    function unlockButtons() {
      btnCreateTenant.disabled = false;
      if (btnQuickInvite) btnQuickInvite.disabled = false;
    }

    function clearForm() {
      tenantNameInput.value = '';
      tenantSlugInput.value = '';
      if (quickSocaIdInput)    quickSocaIdInput.value = '';
      if (quickOwnerEmailInput) quickOwnerEmailInput.value = '';
      if (quickLocationInput)  quickLocationInput.value = '';
    }

    sb.from('tenants')
      .insert({ tenant_id: newId, name: name, slug: slug, status: 'active',
                external_id: socaId || null })
      .then(function (result) {
        if (result.error) {
          unlockButtons();
          setStatus(createTenantStatus, 'Greška pri kreiranju: ' + result.error.message, 'error');
          return;
        }

        // Seed items asynchronously (non-blocking — failures are cosmetic)
        setStatus(createTenantStatus, 'Seedujem stavke…', 'info');
        seedDefaultItems(newId, name).catch(function () {});

        if (!sendInvite || !email) {
          unlockButtons();
          clearForm();
          setStatus(createTenantStatus, 'Apartman "' + name + '" kreiran! ✓', 'info');
          loadTenants();
          return;
        }

        // Call unified Edge Function to invite owner
        setStatus(createTenantStatus, 'Šaljem pozivnicu ' + email + '…', 'info');
        sb.functions.invoke('master_admin', {
          body: { action: 'invite_owner', owner_email: email, tenant_id: newId, tenant_slug: slug }
        }).then(function (fnResult) {
          unlockButtons();
          clearForm();
          if (fnResult.error) {
            setStatus(createTenantStatus,
              'Apartman kreiran ✓, ali pozivnica nije poslata: ' +
              (fnResult.error.message || JSON.stringify(fnResult.error)), 'warning');
          } else {
            var d = fnResult.data || {};
            var note = d.invited
              ? 'Pozivnica poslata! ✓'
              : 'Korisnik već postoji — link i profil su ažurirani.';
            setStatus(createTenantStatus, 'Apartman "' + name + '" kreiran! ' + note, 'info');
          }
          loadTenants();
        }).catch(function (err) {
          unlockButtons();
          clearForm();
          setStatus(createTenantStatus,
            'Apartman kreiran ✓, greška Edge Function: ' + (err && err.message || '?'), 'warning');
          loadTenants();
        });
      });
  }

  // ── MASTER: Link OWNER to tenant + seed permissions ───────────────────────────
  function linkOwnerToTenant() {
    var ownerEmail = ownerEmailInput ? ownerEmailInput.value.trim().toLowerCase() : '';
    var userId     = ownerUserIdInput.value.trim();
    var tenantId   = ownerTenantSelect.value;

    if (!ownerEmail) {
      setStatus(linkOwnerStatus, 'Unesite OWNER e-mail.', 'error');
      return;
    }
    if (!userId || !tenantId) {
      setStatus(linkOwnerStatus, 'Unesite user_id i izaberite tenant.', 'error');
      return;
    }
    var uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(userId)) {
      setStatus(linkOwnerStatus, 'user_id nije validan UUID.', 'error');
      return;
    }

    btnLinkOwner.disabled = true;
    setStatus(linkOwnerStatus, 'Vežem OWNER…', 'info');

    // Step 1: upsert user_profiles (always include email so Vlasnik column populates)
    sb.from('user_profiles')
      .upsert({ user_id: userId, role: 'OWNER', tenant_id: tenantId, email: ownerEmail }, { onConflict: 'user_id' })
      .then(function (r1) {
        if (r1.error) {
          btnLinkOwner.disabled = false;
          setStatus(linkOwnerStatus, 'Greška (user_profiles): ' + r1.error.message, 'error');
          return;
        }

        // Step 2: seed permissions (upsert)
        var perms = [
          { tenant_id: tenantId, role: 'OWNER', section_key: 'info',        item_key: 'default_config',       can_view: true, can_edit: true },
          { tenant_id: tenantId, role: 'OWNER', section_key: 'parking',     item_key: 'parking_recommended',  can_view: true, can_edit: true },
          { tenant_id: tenantId, role: 'OWNER', section_key: 'house_rules', item_key: 'house_rules_private',  can_view: true, can_edit: true },
          { tenant_id: tenantId, role: 'OWNER', section_key: 'booking',     item_key: 'rebook',               can_view: true, can_edit: true }
        ];

        sb.from('permissions')
          .upsert(perms, { onConflict: 'tenant_id,role,section_key,item_key', ignoreDuplicates: false })
          .then(function (r2) {
            btnLinkOwner.disabled = false;

            if (r2.error) {
              setStatus(linkOwnerStatus,
                'Profil vezan, ali greška pri dozvolama: ' + r2.error.message, 'warning');
              return;
            }

            setStatus(linkOwnerStatus,
              'OWNER vezan! Profil + 3 dozvole upisane za tenant.', 'info');
            if (ownerEmailInput) ownerEmailInput.value = '';
            ownerUserIdInput.value   = '';
            ownerTenantSelect.value  = '';
          });
      });
  }

  // ── OWNER: state cache ────────────────────────────────────────────────────────
  var _ownerTenantId = null;
  var _ownerData     = {};
  var _currentRole   = null; // set by loadProfile(); used for save guard

  // Keys an OWNER is permitted to write (client-side mirror of permissions table)
  var OWNER_ALLOWED = [
    { section: 'info',        item: 'default_config' },
    { section: 'house_rules', item: 'house_rules_private' },
    { section: 'parking',     item: 'parking_recommended' },
    { section: 'booking',     item: 'rebook' }
  ];

  function ownerMayWrite(sectionKey, itemKey) {
    if (_currentRole === 'MASTER') return true;
    return OWNER_ALLOWED.some(function (r) {
      return r.section === sectionKey && r.item === itemKey;
    });
  }

  // ── OWNER: helpers ────────────────────────────────────────────────────────────
  function isValidLink(v) {
    return !v || v.startsWith('http://') || v.startsWith('https://') || v.startsWith('./');
  }

  // Ensures the section row exists before any insert on items (prevents FK error)
  function ensureSectionExists(sectionKey) {
    return sb.from('sections').upsert(
      { section_key: sectionKey, title_key: sectionKey, order: 0, visible_default: true },
      { onConflict: 'section_key', ignoreDuplicates: true }
    );
  }

  function upsertItem(tenantId, sectionKey, itemKey, type, orderVal, visible, dataObj) {
    return ensureSectionExists(sectionKey).then(function () {
      return sb.from('items').upsert({
        tenant_id:   tenantId,
        section_key: sectionKey,
        item_key:    itemKey,
        type:        type,
        order:       orderVal,
        visible:     visible,
        data_json:   dataObj,
        updated_at:  new Date().toISOString()
      }, { onConflict: 'tenant_id,section_key,item_key' });
    });
  }

  // ── MASTER: Global item upsert (tenant_id IS NULL) ───────────────────────────
  // Cannot use onConflict='tenant_id,...' for NULLs (NULL != NULL in SQL unique),
  // so we do a select-then-update-or-insert approach.
  function upsertGlobalItem(sectionKey, itemKey, dataObj) {
    var now = new Date().toISOString();
    return ensureSectionExists(sectionKey).then(function () {
      return sb.from('items')
        .select('id')
        .eq('section_key', sectionKey)
        .eq('item_key', itemKey)
        .is('tenant_id', null)
        .maybeSingle()
        .then(function (r) {
          if (r.error) return r;
          if (r.data) {
            return sb.from('items')
              .update({ data_json: dataObj, updated_at: now })
              .eq('id', r.data.id);
          }
          return sb.from('items').insert({
            tenant_id: null, section_key: sectionKey, item_key: itemKey,
            type: 'config', order: 0, visible: true,
            data_json: dataObj, updated_at: now
          });
        });
    });
  }

  // ── MASTER: Load global home_cards config ────────────────────────────────────
  // ── Card definitions for the visual editor ───────────────────────────────
  var CARD_DEFS = [
    { id: 'emergency',        icon: '🚨', label: 'Nujno (Hitna pomoć)' },
    { id: 'parking',          icon: '🅿️',  label: 'Parkiranje' },
    { id: 'restavracije',     icon: '🍽️',  label: 'Restavracije & Kavarne' },
    { id: 'adrenalin',        icon: '🎯', label: 'Adrenalin / Aktivnosti' },
    { id: 'attractions',      icon: '⭐', label: 'Znamenitosti' },
    { id: 'daily_essentials', icon: '🛒', label: 'Daily Essentials' },
    { id: 'taxi_bus',         icon: '🚌', label: 'Taxi / Bus' },
    { id: 'soca_live',        icon: '🌊', label: 'Soča Live' },
    { id: 'lost_found',       icon: '🔍', label: 'Izgubljeno & Nađeno' }
  ];

  function renderCardsEditor(cards) {
    if (!homeCardsEditor) return;
    var idxMap = {};
    if (Array.isArray(cards)) {
      cards.forEach(function (c) { idxMap[c.id] = c; });
    }
    homeCardsEditor.innerHTML = CARD_DEFS.map(function (def, i) {
      var cfg   = idxMap[def.id] || {};
      var order = cfg.order != null ? cfg.order : (i + 1);
      var vis   = cfg.visible !== false;
      return '<div class="ce-row" data-card-id="' + def.id + '" ' +
        'style="display:flex;align-items:center;gap:0.75rem;padding:0.45rem 0.75rem;' +
        'background:rgba(255,255,255,0.05);border-radius:6px">' +
        '<span style="min-width:1.5rem;text-align:center">' + def.icon + '</span>' +
        '<span style="flex:1;font-size:0.88rem">' + def.label + '</span>' +
        '<label style="font-size:0.78rem;display:flex;align-items:center;gap:0.3rem">' +
        'Red:&nbsp;<input type="number" min="1" max="9" value="' + order + '" class="ce-order" ' +
        'style="width:3.2rem;padding:0.18rem 0.3rem;background:rgba(0,0,0,0.3);' +
        'border:1px solid rgba(255,255,255,0.18);border-radius:4px;color:inherit;' +
        'text-align:center;font-size:0.85rem"></label>' +
        '<label style="font-size:0.78rem;display:flex;align-items:center;gap:0.3rem;white-space:nowrap">' +
        '<input type="checkbox" class="ce-visible"' + (vis ? ' checked' : '') + '>&nbsp;Vidljivo</label>' +
        '</div>';
    }).join('');
  }

  function loadGlobalData() {
    sb.from('items')
      .select('data_json')
      .eq('section_key', 'ui')
      .eq('item_key', 'home_cards')
      .is('tenant_id', null)
      .maybeSingle()
      .then(function (r) {
        var cards = (r.data && r.data.data_json && Array.isArray(r.data.data_json.cards))
          ? r.data.data_json.cards : null;
        renderCardsEditor(cards);
      })
      .catch(function () { renderCardsEditor(null); });
  }

  // ── MASTER: Save global home_cards config ────────────────────────────────────
  function saveGlobalData() {
    if (!homeCardsEditor) return;
    var rows  = homeCardsEditor.querySelectorAll('.ce-row');
    var cards = Array.prototype.map.call(rows, function (row) {
      return {
        id:      row.getAttribute('data-card-id'),
        order:   parseInt(row.querySelector('.ce-order').value, 10) || 1,
        visible: row.querySelector('.ce-visible').checked
      };
    });
    btnGlobalSave.disabled = true;
    setStatus(globalSaveStatus, 'Snimam…', 'info');
    upsertGlobalItem('ui', 'home_cards', { cards: cards })
      .then(function (r) {
        btnGlobalSave.disabled = false;
        if (r && r.error) { setStatus(globalSaveStatus, 'Greška: ' + r.error.message, 'error'); return; }
        setStatus(globalSaveStatus, 'Sačuvano! ✓', 'info');
      })
      .catch(function () {
        btnGlobalSave.disabled = false;
        setStatus(globalSaveStatus, 'Neočekivana greška.', 'error');
      });
  }

  // ── MASTER: Municipalities (dynamic list) ────────────────────────────────
  var municipalitiesListEl    = document.getElementById('municipalities-list');
  var municipalitiesSaveStatus = document.getElementById('municipalities-save-status');
  var btnMunicipalitiesAdd    = document.getElementById('btn-municipalities-add');
  var btnMunicipalitiesSave   = document.getElementById('btn-municipalities-save');

  function _renderMunicipalitiesAdmin(slugs) {
    if (!municipalitiesListEl) return;
    municipalitiesListEl.innerHTML = '';
    (slugs || []).forEach(function (slug) {
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:0.5rem';
      row.innerHTML =
        '<input type="text" data-mun-slug value="' + _escHtml(slug) + '" style="flex:1" placeholder="naziv-opstine"/>' +
        '<button data-action="remove-mun" style="background:none;border:1px solid rgba(255,80,80,0.35);' +
          'color:#f87171;border-radius:5px;padding:0.15rem 0.45rem;cursor:pointer;font-size:0.78rem">✕</button>';
      municipalitiesListEl.appendChild(row);
    });
    if (!slugs || !slugs.length) {
      municipalitiesListEl.innerHTML = '<p style="opacity:0.45;font-size:0.82rem;margin:0">Nema opština. Dodaj novu.</p>';
    }
  }

  function _refreshMunDropdowns() {
    // Update KNOWN_MUNICIPALITIES and all filter dropdowns from current DB list
    var slugs = [];
    if (municipalitiesListEl) {
      municipalitiesListEl.querySelectorAll('[data-mun-slug]').forEach(function (inp) {
        var v = inp.value.trim().toLowerCase().replace(/\s+/g, '-');
        if (v) slugs.push(v);
      });
    }
    if (!slugs.length) slugs = ['bovec'];
    KNOWN_MUNICIPALITIES.length = 0;
    slugs.forEach(function (s) { KNOWN_MUNICIPALITIES.push(s); });

    // Refresh the filter dropdown in the bar
    if (munFilterSelect) {
      var current = munFilterSelect.value;
      munFilterSelect.innerHTML = '<option value="">Sve opštine</option>' +
        KNOWN_MUNICIPALITIES.map(function (m) {
          return '<option value="' + m + '"' + (m === current ? ' selected' : '') + '>' +
            m.charAt(0).toUpperCase() + m.slice(1).replace(/-/g, ' ') + '</option>';
        }).join('');
    }
    // Refresh partners municipality filter dropdown
    _syncPartnerMunFilter();
    // Refresh analytics municipality filter dropdown
    _syncPaMunFilter();
  }

  function loadMunicipalities() {
    if (!municipalitiesListEl) return;
    municipalitiesListEl.innerHTML = '<p style="opacity:0.45;font-size:0.82rem;margin:0">Učitavam…</p>';
    sb.from('items')
      .select('data_json')
      .eq('section_key', 'municipalities')
      .eq('item_key', 'list')
      .is('tenant_id', null)
      .maybeSingle()
      .then(function (r) {
        var slugs = (r.data && r.data.data_json && Array.isArray(r.data.data_json.slugs))
          ? r.data.data_json.slugs
          : ['bovec', 'kobarid', 'tolmin'];
        _renderMunicipalitiesAdmin(slugs);
        _refreshMunDropdowns();
      })
      .catch(function () {
        _renderMunicipalitiesAdmin(['bovec', 'kobarid', 'tolmin']);
        _refreshMunDropdowns();
      });
  }

  function saveMunicipalities() {
    if (!municipalitiesListEl) return;
    var slugs = [];
    municipalitiesListEl.querySelectorAll('[data-mun-slug]').forEach(function (inp) {
      var v = inp.value.trim().toLowerCase().replace(/\s+/g, '-');
      if (v) slugs.push(v);
    });
    if (!slugs.length) { setStatus(municipalitiesSaveStatus, 'Lista ne može biti prazna.', 'error'); return; }
    if (btnMunicipalitiesSave) btnMunicipalitiesSave.disabled = true;
    setStatus(municipalitiesSaveStatus, 'Čuvam…', '');
    sb.from('items').upsert({
      tenant_id: null, section_key: 'municipalities', item_key: 'list',
      type: 'config', order: 1, visible: true,
      data_json: { slugs: slugs },
      municipality_slugs: null, updated_at: new Date().toISOString()
    }, { onConflict: 'tenant_id,section_key,item_key' })
      .then(function (r) {
        if (btnMunicipalitiesSave) btnMunicipalitiesSave.disabled = false;
        if (r.error) { setStatus(municipalitiesSaveStatus, 'Greška: ' + r.error.message, 'error'); return; }
        setStatus(municipalitiesSaveStatus, 'Sačuvano ✓', 'success');
        KNOWN_MUNICIPALITIES.length = 0;
        slugs.forEach(function (s) { KNOWN_MUNICIPALITIES.push(s); });
        _refreshMunDropdowns();
      }).catch(function (err) {
        if (btnMunicipalitiesSave) btnMunicipalitiesSave.disabled = false;
        setStatus(municipalitiesSaveStatus, 'Greška: ' + (err && err.message ? err.message : err), 'error');
      });
  }

  if (municipalitiesListEl) {
    municipalitiesListEl.addEventListener('click', function (e) {
      if (e.target.dataset.action === 'remove-mun') {
        e.target.closest('div').remove();
        if (!municipalitiesListEl.children.length) {
          municipalitiesListEl.innerHTML = '<p style="opacity:0.45;font-size:0.82rem;margin:0">Nema opština. Dodaj novu.</p>';
        }
      }
    });
  }
  if (btnMunicipalitiesAdd) {
    btnMunicipalitiesAdd.addEventListener('click', function () {
      if (municipalitiesListEl) {
        var p = municipalitiesListEl.querySelector('p');
        if (p) p.remove();
        var row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:0.5rem';
        row.innerHTML =
          '<input type="text" data-mun-slug value="" style="flex:1" placeholder="nova-opstina"/>' +
          '<button data-action="remove-mun" style="background:none;border:1px solid rgba(255,80,80,0.35);' +
            'color:#f87171;border-radius:5px;padding:0.15rem 0.45rem;cursor:pointer;font-size:0.78rem">✕</button>';
        municipalitiesListEl.appendChild(row);
        row.querySelector('[data-mun-slug]').focus();
      }
    });
  }
  if (btnMunicipalitiesSave) btnMunicipalitiesSave.addEventListener('click', saveMunicipalities);

  // ── MASTER: Daily Essentials ───────────────────────────────────────────────
  var deListEl      = document.getElementById('de-list');
  var deSaveStatus  = document.getElementById('de-save-status');
  var btnDeAdd      = document.getElementById('btn-de-add');
  var btnDeSave     = document.getElementById('btn-de-save');

  var DE_LABEL_OPTIONS = [
    { key: 'quick_help_supermarket', label: '🛒 Prodavnica / Supermarket' },
    { key: 'quick_help_atm',         label: '🏧 Bankomat / ATM' },
    { key: 'quick_help_gas',         label: '⛽ Pumpa / Gas station' },
    { key: 'quick_help_parking',     label: '🅿️ Parking' },
    { key: 'quick_help_toilet',      label: '🚻 Javni toalet' },
    { key: 'quick_help_pharmacy',    label: '💊 Apoteka / Pharmacy' },
    { key: 'quick_help_hospital',    label: '🏥 Bolnica / Hospital' },
    { key: 'quick_help_post',        label: '📮 Pošta / Post office' },
    { key: 'custom',                 label: '✏️ Prilagođen naziv' }
  ];

  function _buildDeLabelOptions(selected) {
    return DE_LABEL_OPTIONS.map(function(o) {
      return '<option value="' + o.key + '"' + (o.key === selected ? ' selected' : '') + '>' + o.label + '</option>';
    }).join('');
  }

  function _addDeRow(item) {
    if (!deListEl) return;
    var lk = (item && item.label_key) || 'quick_help_supermarket';
    var url = (item && item.url) || '';
    var customLabel = (item && item.custom_label) || '';
    var muns = (item && item.municipality_slugs) || [];
    var div = document.createElement('div');
    div.className = 'admin-row';
    div.style.cssText = 'display:flex;flex-direction:column;gap:0.4rem;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:0.6rem;';
    div.innerHTML =
      '<div style="display:flex;gap:0.4rem;align-items:center;flex-wrap:wrap">' +
      '  <select class="de-label-key" style="flex:0 0 auto;min-width:200px">' + _buildDeLabelOptions(lk) + '</select>' +
      '  <input type="text" class="de-custom-label" placeholder="Prilagođen naziv" value="' + _esc(customLabel) + '" style="flex:1 1 120px;display:' + (lk === 'custom' ? 'block' : 'none') + '">' +
      '  <button class="btn-secondary btn-sm de-del-btn" style="margin-left:auto">🗑</button>' +
      '</div>' +
      '<input type="url" class="de-url" placeholder="https://..." value="' + _esc(url) + '" style="width:100%;box-sizing:border-box">' +
      '<div class="de-mun-wrap">' + _buildMunHtml(muns) + '</div>';
    deListEl.appendChild(div);
    div.querySelector('.de-label-key').addEventListener('change', function() {
      var ci = div.querySelector('.de-custom-label');
      ci.style.display = this.value === 'custom' ? 'block' : 'none';
    });
    div.querySelector('.de-del-btn').addEventListener('click', function() { div.remove(); });
  }

  function loadDailyEssentials() {
    if (!deListEl) return;
    deListEl.innerHTML = '<p style="opacity:0.45;font-size:0.82rem;margin:0">Učitavam…</p>';
    sb.from('items')
      .select('id, item_key, data_json, municipality_slugs, order')
      .eq('section_key', 'daily_essentials')
      .is('tenant_id', null)
      .order('order', { ascending: true })
      .then(function(r) {
        deListEl.innerHTML = '';
        if (r.error || !r.data || !r.data.length) { deListEl.innerHTML = '<p style="opacity:0.4;font-size:0.82rem;margin:0">Nema unosa.</p>'; return; }
        r.data.forEach(function(row) {
          var item = Object.assign({}, row.data_json || {});
          item.municipality_slugs = row.municipality_slugs || [];
          _addDeRow(item);
        });
        _applyMunFilter();
      });
  }

  function saveDailyEssentials() {
    if (!deListEl) return;
    var rows = deListEl.querySelectorAll('.admin-row');
    var upserts = [];
    rows.forEach(function(row, i) {
      var lk = row.querySelector('.de-label-key').value;
      var url = (row.querySelector('.de-url').value || '').trim();
      var customLabel = (row.querySelector('.de-custom-label').value || '').trim();
      var muns = _getMunSlugs(row);
      if (!url) return;
      upserts.push({
        section_key: 'daily_essentials',
        item_key: lk + '_' + i,
        tenant_id: null,
        data_json: { label_key: lk, url: url, custom_label: customLabel },
        municipality_slugs: muns.length ? muns : null,
        visible: true,
        order: i
      });
    });
    if (deSaveStatus) { deSaveStatus.textContent = 'Čuvam…'; deSaveStatus.className = 'msg'; }
    sb.from('items').delete().is('tenant_id', null).eq('section_key', 'daily_essentials')
      .then(function(d) {
        if (d.error) { if (deSaveStatus) { deSaveStatus.textContent = 'Greška pri brisanju: ' + d.error.message; deSaveStatus.className = 'msg msg--error'; } return; }
        if (!upserts.length) { if (deSaveStatus) { deSaveStatus.textContent = 'Sačuvano (prazno).'; deSaveStatus.className = 'msg msg--ok'; } return; }
        sb.from('items').insert(upserts).then(function(ins) {
          if (ins.error) { if (deSaveStatus) { deSaveStatus.textContent = 'Greška: ' + ins.error.message; deSaveStatus.className = 'msg msg--error'; } return; }
          if (deSaveStatus) { deSaveStatus.textContent = '✓ Sačuvano ' + upserts.length + ' linkova.'; deSaveStatus.className = 'msg msg--ok'; }
        });
      });
  }

  if (btnDeAdd)  btnDeAdd.addEventListener('click',  function() { _addDeRow(null); });
  if (btnDeSave) btnDeSave.addEventListener('click',  saveDailyEssentials);

  // ── MASTER: Partners (Adrenalin / Restorani / Taxi) ──────────────────────
  var partnersListEl      = document.getElementById('partners-list');
  var partnersBadge       = document.getElementById('partners-badge');
  var partnersStatus      = document.getElementById('partners-status');
  var partnerFormWrap     = document.getElementById('partner-form-wrap');
  var partnerFormTitle    = document.getElementById('partner-form-title');
  var partnerFormStatus   = document.getElementById('partner-form-status');
  var pfId                = document.getElementById('pf-id');
  var pfName              = document.getElementById('pf-name');
  var pfTypeSel           = document.getElementById('pf-type-sel');
  var pfCategory          = document.getElementById('pf-category');
  var pfTierSel           = document.getElementById('pf-tier-sel');
  var pfOrder             = document.getElementById('pf-order');
  var pfDesc              = document.getElementById('pf-desc');
  var pfImage             = document.getElementById('pf-image');       // hidden, stores URL
  var pfLogo              = document.getElementById('pf-logo');        // hidden, stores URL
  var pfImageFile         = document.getElementById('pf-image-file');  // file input hero
  var pfLogoFile          = document.getElementById('pf-logo-file');   // file input logo
  var pfImagePreviewWrap  = document.getElementById('pf-image-preview-wrap');
  var pfImagePreview      = document.getElementById('pf-image-preview');
  var pfImageFilename     = document.getElementById('pf-image-filename');
  var pfLogoPreviewWrap   = document.getElementById('pf-logo-preview-wrap');
  var pfLogoPreview       = document.getElementById('pf-logo-preview');
  var pfLogoFilename      = document.getElementById('pf-logo-filename');
  var pfUploadStatus      = document.getElementById('pf-upload-status');
  var pfPhone             = document.getElementById('pf-phone');
  var pfWhatsapp          = document.getElementById('pf-whatsapp');
  var pfWebsite           = document.getElementById('pf-website');
  var pfBooking           = document.getElementById('pf-booking');
  var pfAllMun            = document.getElementById('pf-all-mun');
  var pfMunWrap           = document.getElementById('pf-mun-wrap');
  var pfActive            = document.getElementById('pf-active');
  var btnPartnerAdd       = document.getElementById('btn-partner-add');
  var btnPartnerSave      = document.getElementById('btn-partner-save');
  var btnPartnerCancel    = document.getElementById('btn-partner-cancel');
  var btnPartnersFilter   = document.getElementById('btn-partners-filter');
  var pfFilterType        = document.getElementById('pf-type');
  var pfFilterTier        = document.getElementById('pf-tier');
  var pfFilterMun         = document.getElementById('pf-mun');

  // Category labels for display
  var PARTNER_CAT_LABELS = {
    rafting:'Rafting', paragliding:'Paragliding', kayak:'Kajak', canyoning:'Kanjoning',
    hiking:'Planinarenje', cycling:'Biciklizam', climbing:'Penjanje', zipline:'Zipline', other_act:'Ostalo',
    restaurant:'Restoran', gostilna:'Gostilna', cafe:'Kafić', pizzeria:'Pizzerija',
    bar:'Bar', bistro:'Bistro', brewery:'Pivara', street_food:'Street food', other_food:'Ostalo',
    taxi:'Taxi', transfer:'Transfer', bus:'Bus', other_taxi:'Ostalo'
  };
  var PARTNER_TYPE_LABELS = { activities:'🎯 Adrenalin', food:'🍽️ Restorani', taxi:'🚌 Taxi' };
  var PARTNER_TIER_LABELS = { premium:'⭐ Premium', featured:'🔥 Featured', standard:'📍 Standard' };
  var PARTNER_TIER_COLORS = { premium:'rgba(251,191,36,0.15)', featured:'rgba(249,115,22,0.1)', standard:'rgba(255,255,255,0.04)' };

  // ── Image upload helpers ──────────────────────────────────────────────────
  function _setupFileInput(fileInput, hiddenInput, previewImg, previewWrap, filenameSpan, folder) {
    if (!fileInput) return;
    fileInput.addEventListener('change', function() {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;
      // Show local preview immediately
      var reader = new FileReader();
      reader.onload = function(e) {
        if (previewImg)   previewImg.src = e.target.result;
        if (previewWrap)  previewWrap.style.display = 'block';
        if (filenameSpan) filenameSpan.textContent = file.name;
      };
      reader.readAsDataURL(file);
      // Upload to Supabase Storage
      _uploadImageToStorage(file, folder, hiddenInput);
    });
  }

  function _uploadImageToStorage(file, folder, hiddenInput) {
    if (pfUploadStatus) { pfUploadStatus.textContent = '⏳ Uploadujem…'; pfUploadStatus.style.display = 'block'; }
    var ext  = file.name.split('.').pop().toLowerCase();
    var name = folder + '/' + Date.now() + '_' + Math.random().toString(36).slice(2) + '.' + ext;
    Promise.resolve(
      sb.storage.from('partner-images').upload(name, file, { upsert: true, contentType: file.type })
    ).then(function(r) {
      if (r.error) {
        if (pfUploadStatus) { pfUploadStatus.textContent = '❌ Upload greška: ' + r.error.message; pfUploadStatus.style.color = '#f87171'; }
        return;
      }
      var pub = sb.storage.from('partner-images').getPublicUrl(name);
      var url = pub && pub.data && pub.data.publicUrl ? pub.data.publicUrl : '';
      if (hiddenInput) hiddenInput.value = url;
      if (pfUploadStatus) { pfUploadStatus.textContent = '✅ Slika uploadovana'; pfUploadStatus.style.color = '#4ade80'; setTimeout(function(){ pfUploadStatus.style.display='none'; }, 3000); }
    }).catch(function(err) {
      if (pfUploadStatus) { pfUploadStatus.textContent = '❌ ' + (err && err.message ? err.message : 'Upload error'); pfUploadStatus.style.color = '#f87171'; }
    });
  }

  function _clearImageField(hiddenInput, previewImg, previewWrap, filenameSpan, fileInput) {
    if (hiddenInput)  hiddenInput.value = '';
    if (previewImg)   previewImg.src = '';
    if (previewWrap)  previewWrap.style.display = 'none';
    if (filenameSpan) filenameSpan.textContent = 'Nema odabrane slike';
    if (fileInput)    fileInput.value = '';
  }

  function _loadExistingPreview(url, previewImg, previewWrap, filenameSpan, isSquare) {
    if (url && previewImg && previewWrap) {
      previewImg.src = url;
      if (isSquare) previewImg.style.cssText = 'width:80px;height:80px;object-fit:cover;border-radius:8px;border:1px solid rgba(34,211,238,0.2)';
      previewWrap.style.display = 'block';
      if (filenameSpan) filenameSpan.textContent = 'Trenutna slika';
    } else if (previewWrap) {
      previewWrap.style.display = 'none';
      if (filenameSpan) filenameSpan.textContent = 'Nema odabrane slike';
    }
  }

  // Wire file inputs
  _setupFileInput(pfLogoFile,  pfLogo,  pfLogoPreview,  pfLogoPreviewWrap,  pfLogoFilename,  'logos');
  _setupFileInput(pfImageFile, pfImage, pfImagePreview, pfImagePreviewWrap, pfImageFilename, 'heroes');

  var btnLogoClr  = document.getElementById('btn-pf-logo-clear');
  var btnImageClr = document.getElementById('btn-pf-image-clear');
  if (btnLogoClr)  btnLogoClr.addEventListener('click',  function() { _clearImageField(pfLogo,  pfLogoPreview,  pfLogoPreviewWrap,  pfLogoFilename,  pfLogoFile); });
  if (btnImageClr) btnImageClr.addEventListener('click', function() { _clearImageField(pfImage, pfImagePreview, pfImagePreviewWrap, pfImageFilename, pfImageFile); });

  // ── Build municipality checkboxes in partner form ─────────────────────────
  function _buildPartnerMunHtml(selected) {
    if (!pfMunWrap) return;
    pfMunWrap.innerHTML = KNOWN_MUNICIPALITIES.map(function(m) {
      var checked = selected && selected.indexOf(m) >= 0;
      return '<label style="display:flex;align-items:center;gap:4px;font-size:0.8rem;opacity:0.85">' +
        '<input type="checkbox" class="pfm-cb" value="' + m + '"' + (checked ? ' checked' : '') + '>' +
        m.charAt(0).toUpperCase() + m.slice(1) + '</label>';
    }).join('');
    if (pfAllMun) pfMunWrap.style.opacity = pfAllMun.checked ? '0.4' : '1';
  }

  function _getPartnerMunSelected() {
    if (!pfMunWrap) return [];
    var cbs = pfMunWrap.querySelectorAll('.pfm-cb:checked');
    return Array.from(cbs).map(function(c) { return c.value; });
  }

  if (pfAllMun) {
    pfAllMun.addEventListener('change', function() {
      if (pfMunWrap) pfMunWrap.style.opacity = this.checked ? '0.4' : '1';
    });
  }

  // Sync category dropdown based on type
  var CAT_BY_TYPE = {
    activities: ['rafting','paragliding','kayak','canyoning','hiking','cycling','climbing','zipline','other_act'],
    food:       ['restaurant','gostilna','cafe','pizzeria','bar','bistro','brewery','street_food','other_food'],
    taxi:       ['taxi','transfer','bus','other_taxi']
  };

  function _syncCategoryByType(type, selected) {
    if (!pfCategory) return;
    var cats = CAT_BY_TYPE[type] || [];
    pfCategory.innerHTML = cats.map(function(c) {
      return '<option value="' + c + '"' + (c === selected ? ' selected' : '') + '>' + (PARTNER_CAT_LABELS[c] || c) + '</option>';
    }).join('');
  }

  if (pfTypeSel) pfTypeSel.addEventListener('change', function() { _syncCategoryByType(this.value, ''); });

  // Render partner list
  function _renderPartnerRow(p) {
    if (!partnersListEl) return;
    var d = document.createElement('div');
    d.setAttribute('data-pid', p.id);
    var tierColor = PARTNER_TIER_COLORS[p.tier] || 'rgba(255,255,255,0.04)';
    var munStr = p.all_municipalities ? 'Sve opštine' : (p.municipalities || []).join(', ');
    d.style.cssText = 'background:' + tierColor + ';border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:0.5rem 0.7rem;font-size:0.82rem;';
    var logoHtml = p.logo_url
      ? '<img src="' + _esc(p.logo_url) + '" alt="" style="width:36px;height:36px;object-fit:cover;border-radius:6px;border:1px solid rgba(34,211,238,0.2);flex-shrink:0">'
      : '<div style="width:36px;height:36px;border-radius:6px;background:rgba(34,211,238,0.1);border:1px solid rgba(34,211,238,0.15);display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0">🏢</div>';
    d.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:0.4rem;flex-wrap:wrap">' +
      '<div style="display:flex;align-items:center;gap:0.5rem;flex:1;min-width:0">' + logoHtml +
      '<span style="font-weight:600">' + _esc(p.name) + '</span></div>' +
      '<div style="display:flex;gap:0.3rem;flex-wrap:wrap;align-items:center">' +
      '<span style="font-size:0.72rem;opacity:0.6;background:rgba(255,255,255,0.06);padding:1px 6px;border-radius:4px">' + (PARTNER_TIER_LABELS[p.tier] || p.tier) + '</span>' +
      '<span style="font-size:0.72rem;opacity:0.6;background:rgba(255,255,255,0.06);padding:1px 6px;border-radius:4px">' + (PARTNER_TYPE_LABELS[p.type] || p.type) + '</span>' +
      '<span style="font-size:0.72rem;opacity:0.6">' + (PARTNER_CAT_LABELS[p.category] || p.category) + '</span>' +
      (!p.is_active ? '<span style="font-size:0.72rem;color:#f87171">● Neaktivan</span>' : '') +
      '<button class="btn-secondary btn-sm btn-p-edit" data-pid="' + p.id + '">✏️ Uredi</button>' +
      '<button class="btn-secondary btn-sm btn-p-del" data-pid="' + p.id + '" style="color:#f87171;border-color:#f87171">🗑</button>' +
      '</div></div>' +
      '<div style="font-size:0.78rem;opacity:0.55;margin-top:0.2rem">' +
      (p.short_desc ? _esc(p.short_desc).substring(0, 80) + (p.short_desc.length > 80 ? '…' : '') : '') +
      ' &nbsp;|&nbsp; 📍 ' + _esc(munStr) +
      (p.phone ? ' &nbsp;|&nbsp; 📞 ' + _esc(p.phone) : '') +
      (p.website_url ? ' &nbsp;|&nbsp; <a href="' + _esc(p.website_url) + '" target="_blank" rel="noopener" style="color:#22d3ee;font-size:0.75rem">🌐 Web</a>' : '') +
      '</div>';
    d.querySelector('.btn-p-edit').addEventListener('click', function() { _openPartnerForm(p); });
    d.querySelector('.btn-p-del').addEventListener('click', function() { _deletePartner(p.id); });
    partnersListEl.appendChild(d);
  }

  function loadPartners() {
    if (!partnersListEl) return;
    partnersListEl.innerHTML = '<p style="opacity:0.45;font-size:0.82rem;margin:0">⏳ Učitavam partnere…</p>';

    var fType = pfFilterType ? pfFilterType.value.trim() : '';
    var fTier = pfFilterTier ? pfFilterTier.value.trim() : '';
    var fMun  = pfFilterMun  ? pfFilterMun.value.trim()  : '';

    // Build query step by step to avoid chaining issues
    var q = sb.from('partners').select('*');
    if (fType) q = q.eq('type', fType);
    if (fTier) q = q.eq('tier', fTier);
    q = q.order('type', { ascending: true })
         .order('order_index', { ascending: true });

    q.then(function(r) {
      partnersListEl.innerHTML = '';

      if (r.error) {
        partnersListEl.innerHTML = '<p style="color:#f87171;font-size:0.82rem">❌ Greška: ' + _esc(r.error.message) + '</p>';
        console.error('[loadPartners]', r.error);
        return;
      }

      var rows = r.data || [];

      // Client-side municipality filter
      if (fMun) {
        rows = rows.filter(function(p) {
          return p.all_municipalities || (p.municipalities && p.municipalities.indexOf(fMun) >= 0);
        });
      }

      if (partnersBadge) {
        partnersBadge.textContent = rows.length;
        partnersBadge.style.display = rows.length ? 'inline' : 'none';
      }

      if (!rows.length) {
        partnersListEl.innerHTML = '<p style="opacity:0.4;font-size:0.82rem;margin:0">Nema partnera za odabrane filtere.</p>';
        return;
      }

      // Group by type
      var types = ['activities', 'food', 'taxi'];
      types.forEach(function(t) {
        var byType = rows.filter(function(p) { return p.type === t; });
        if (!byType.length) return;
        var hdr = document.createElement('div');
        hdr.style.cssText = 'font-size:0.75rem;font-weight:700;opacity:0.5;text-transform:uppercase;letter-spacing:1px;margin:0.6rem 0 0.3rem;padding:0.2rem 0;border-bottom:1px solid rgba(255,255,255,0.08)';
        hdr.textContent = (PARTNER_TYPE_LABELS[t] || t) + ' (' + byType.length + ')';
        partnersListEl.appendChild(hdr);
        byType.forEach(function(p) { _renderPartnerRow(p); });
      });
    }).catch(function(err) {
      partnersListEl.innerHTML = '<p style="color:#f87171;font-size:0.82rem">❌ ' + (err && err.message ? _esc(err.message) : 'Nepoznata greška') + '</p>';
      console.error('[loadPartners catch]', err);
    });
  }

  function _openPartnerForm(p) {
    if (!partnerFormWrap) return;
    partnerFormWrap.style.display = 'block';
    if (partnerFormTitle) partnerFormTitle.textContent = p ? ('✏️ Uredi: ' + p.name) : '➕ Novi partner';
    var badge = document.getElementById('partner-form-type-badge');
    if (badge) badge.textContent = p ? (PARTNER_TYPE_LABELS[p.type] || p.type) : '';
    if (pfId)       pfId.value       = p ? p.id : '';
    if (pfName)     pfName.value     = p ? p.name : '';
    if (pfTypeSel)  pfTypeSel.value  = p ? p.type : 'activities';
    _syncCategoryByType(p ? p.type : 'activities', p ? p.category : '');
    if (pfTierSel)  pfTierSel.value  = p ? p.tier : 'standard';
    if (pfOrder)    pfOrder.value    = p ? p.order_index : 100;
    if (pfDesc)     pfDesc.value     = p ? (p.short_desc || '') : '';
    // Images — set hidden values + show existing previews
    if (pfImage)    pfImage.value    = p ? (p.image_url || '') : '';
    if (pfLogo)     pfLogo.value     = p ? (p.logo_url  || '') : '';
    _loadExistingPreview(p ? p.image_url : '', pfImagePreview, pfImagePreviewWrap, pfImageFilename);
    _loadExistingPreview(p ? p.logo_url  : '', pfLogoPreview,  pfLogoPreviewWrap,  pfLogoFilename, true);
    if (pfUploadStatus) pfUploadStatus.style.display = 'none';
    if (pfPhone)    pfPhone.value    = p ? (p.phone || '') : '';
    if (pfWhatsapp) pfWhatsapp.value = p ? (p.whatsapp || '') : '';
    if (pfWebsite)  pfWebsite.value  = p ? (p.website_url || '') : '';
    if (pfBooking)  pfBooking.value  = p ? (p.booking_url || '') : '';
    if (pfAllMun)   pfAllMun.checked = p ? !!p.all_municipalities : false;
    if (pfActive)   pfActive.checked = p ? !!p.is_active : true;
    _buildPartnerMunHtml(p ? (p.municipalities || []) : []);
    if (partnerFormStatus) { partnerFormStatus.className = 'msg hidden'; }
    partnerFormWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function _savePartner() {
    var name = pfName ? pfName.value.trim() : '';
    if (!name) { if (partnerFormStatus) { partnerFormStatus.textContent = 'Naziv je obavezan.'; partnerFormStatus.className = 'msg msg--error'; } return; }
    var id       = pfId      ? pfId.value.trim() : '';
    var allMun   = pfAllMun  ? pfAllMun.checked  : false;
    var muns     = allMun    ? null : _getPartnerMunSelected();
    var payload  = {
      name:              name,
      type:              pfTypeSel  ? pfTypeSel.value  : 'activities',
      category:          pfCategory ? pfCategory.value : 'other',
      tier:              pfTierSel  ? pfTierSel.value  : 'standard',
      order_index:       pfOrder    ? (parseInt(pfOrder.value) || 100) : 100,
      short_desc:        pfDesc     ? pfDesc.value.trim()    || null : null,
      image_url:         pfImage    ? pfImage.value.trim()   || null : null,
      logo_url:          pfLogo     ? pfLogo.value.trim()    || null : null,
      phone:             pfPhone    ? pfPhone.value.trim()   || null : null,
      whatsapp:          pfWhatsapp ? pfWhatsapp.value.trim()|| null : null,
      website_url:       pfWebsite  ? pfWebsite.value.trim() || null : null,
      booking_url:       pfBooking  ? pfBooking.value.trim() || null : null,
      municipalities:    muns && muns.length ? muns : null,
      all_municipalities:allMun,
      is_active:         pfActive   ? pfActive.checked : true,
      updated_at:        new Date().toISOString()
    };
    if (btnPartnerSave) btnPartnerSave.disabled = true;
    if (partnerFormStatus) { partnerFormStatus.textContent = 'Čuvam…'; partnerFormStatus.className = 'msg'; }
    var q = id
      ? sb.from('partners').update(payload).eq('id', id)
      : sb.from('partners').insert(payload);
    q.then(function(r) {
      if (btnPartnerSave) btnPartnerSave.disabled = false;
      if (r.error) { if (partnerFormStatus) { partnerFormStatus.textContent = 'Greška: ' + r.error.message; partnerFormStatus.className = 'msg msg--error'; } return; }
      if (partnerFormStatus) { partnerFormStatus.textContent = '✓ Sačuvano!'; partnerFormStatus.className = 'msg msg--ok'; }
      partnerFormWrap.style.display = 'none';
      loadPartners();
    });
  }

  function _deletePartner(id) {
    if (!confirm('Obriši partnera?')) return;
    sb.from('partners').delete().eq('id', id).then(function(r) {
      if (r.error) { if (partnersStatus) { partnersStatus.textContent = 'Greška: ' + r.error.message; partnersStatus.className = 'msg msg--error'; } return; }
      loadPartners();
    });
  }

  // Sync municipality filter dropdown with KNOWN_MUNICIPALITIES
  function _syncPartnerMunFilter() {
    if (!pfFilterMun) return;
    var cur = pfFilterMun.value;
    pfFilterMun.innerHTML = '<option value="">Sve opštine</option>' +
      KNOWN_MUNICIPALITIES.map(function(m) {
        return '<option value="' + m + '"' + (m === cur ? ' selected' : '') + '>' + m.charAt(0).toUpperCase() + m.slice(1) + '</option>';
      }).join('');
  }

  if (btnPartnerAdd)    btnPartnerAdd.addEventListener('click',    function() { _openPartnerForm(null); });
  if (btnPartnerSave)   btnPartnerSave.addEventListener('click',   _savePartner);
  if (btnPartnerCancel) btnPartnerCancel.addEventListener('click', function() { partnerFormWrap.style.display = 'none'; });
  if (btnPartnersFilter)btnPartnersFilter.addEventListener('click',loadPartners);

  // ── MASTER: Partner Analytics ────────────────────────────────────────────
  var paFromEl     = document.getElementById('pa-from');
  var paToEl       = document.getElementById('pa-to');
  var paTypeEl     = document.getElementById('pa-type');
  var paTierEl     = document.getElementById('pa-tier');
  var paMunEl      = document.getElementById('pa-mun');
  var btnPaLoad    = document.getElementById('btn-pa-load');
  var btnPaExport  = document.getElementById('btn-pa-export-grouped');
  var paStatusEl   = document.getElementById('pa-status');
  var paSummaryEl  = document.getElementById('pa-summary');
  var paTableEl    = document.getElementById('pa-table');
  var paTbody      = document.getElementById('pa-tbody');
  var paImpEl      = document.getElementById('pa-sum-imp');
  var paClicksEl   = document.getElementById('pa-sum-clicks');
  var paCtrEl      = document.getElementById('pa-sum-ctr');
  var paBadge      = document.getElementById('panalytics-badge');

  // Default date range: last 30 days
  (function() {
    if (!paFromEl || !paToEl) return;
    var now = new Date();
    var from = new Date(now); from.setDate(now.getDate() - 30);
    paToEl.value   = now.toISOString().slice(0,10);
    paFromEl.value = from.toISOString().slice(0,10);
  })();

  var _paData    = [];   // raw grouped rows
  var _paSort    = { col: 'impressions', asc: false };

  function _syncPaMunFilter() {
    if (!paMunEl) return;
    var cur = paMunEl.value;
    paMunEl.innerHTML = '<option value="">Sve opštine</option>' +
      KNOWN_MUNICIPALITIES.map(function(m) {
        return '<option value="' + m + '"' + (m === cur ? ' selected' : '') + '>' +
          m.charAt(0).toUpperCase() + m.slice(1) + '</option>';
      }).join('');
  }

  function loadPartnerAnalytics() {
    if (!paTbody) return;
    if (paStatusEl) { paStatusEl.textContent = 'Učitavam…'; paStatusEl.className = 'msg'; }
    if (paSummaryEl) paSummaryEl.style.display = 'none';
    if (paTableEl)   paTableEl.style.display   = 'none';
    if (paTbody)     paTbody.innerHTML = '';

    var from = paFromEl ? paFromEl.value : '';
    var to   = paToEl   ? paToEl.value   : '';
    var type = paTypeEl ? paTypeEl.value : '';
    var tier = paTierEl ? paTierEl.value : '';
    var mun  = paMunEl  ? paMunEl.value  : '';

    // Build query on partner_events joined with partners
    var q = sb.from('partner_events')
      .select('partner_id, event_name, tier, type, category, municipality_slug, partners(name, tier, category, type)');
    if (from) q = q.gte('created_at', from + 'T00:00:00Z');
    if (to)   q = q.lte('created_at', to   + 'T23:59:59Z');
    if (type) q = q.eq('type', type);
    if (tier) q = q.eq('tier', tier);
    if (mun)  q = q.eq('municipality_slug', mun);
    // Exclude filter_used from the main metrics (it's not a partner interaction)
    q = q.neq('event_name', 'filter_used');

    q.then(function(r) {
      if (r.error) {
        if (paStatusEl) { paStatusEl.textContent = 'Greška: ' + r.error.message; paStatusEl.className = 'msg msg--error'; }
        return;
      }
      var rows = r.data || [];
      // Group by partner_id
      var byPartner = {};
      rows.forEach(function(ev) {
        var pid = ev.partner_id;
        if (!pid) return;
        if (!byPartner[pid]) {
          var p = ev.partners || {};
          byPartner[pid] = {
            id: pid,
            name:        p.name     || '—',
            tier:        p.tier     || ev.tier     || '—',
            category:    p.category || ev.category || '—',
            type:        p.type     || ev.type     || '—',
            impressions: 0, opens: 0, calls: 0, whatsapp: 0, bookings: 0
          };
        }
        var g = byPartner[pid];
        if      (ev.event_name === 'impression')      g.impressions++;
        else if (ev.event_name === 'click_open')       g.opens++;
        else if (ev.event_name === 'click_call')       g.calls++;
        else if (ev.event_name === 'click_whatsapp')   g.whatsapp++;
        else if (ev.event_name === 'click_booking')    g.bookings++;
      });
      _paData = Object.values(byPartner).map(function(g) {
        g.ctr = g.impressions > 0 ? Math.round((g.opens / g.impressions) * 100) : 0;
        return g;
      });

      _renderPaTable();

      // Summary
      var totalImp    = _paData.reduce(function(s,g) { return s + g.impressions; }, 0);
      var totalClicks = _paData.reduce(function(s,g) { return s + g.opens + g.calls + g.whatsapp + g.bookings; }, 0);
      var totalCtr    = totalImp > 0 ? Math.round((_paData.reduce(function(s,g){return s+g.opens;},0) / totalImp)*100) : 0;
      if (paImpEl)    paImpEl.textContent    = totalImp.toLocaleString();
      if (paClicksEl) paClicksEl.textContent = totalClicks.toLocaleString();
      if (paCtrEl)    paCtrEl.textContent    = totalCtr + '%';
      if (paSummaryEl) paSummaryEl.style.display = 'grid';
      if (paTableEl)   paTableEl.style.display   = '';
      if (paBadge) { paBadge.textContent = _paData.length; paBadge.style.display = _paData.length ? 'inline' : 'none'; }
      if (paStatusEl) { paStatusEl.className = 'msg hidden'; }
    }).catch(function(err) {
      if (paStatusEl) { paStatusEl.textContent = 'Greška: ' + (err && err.message ? err.message : err); paStatusEl.className = 'msg msg--error'; }
    });
  }

  var TIER_ICON = { premium:'⭐', featured:'🔥', standard:'📍' };
  var TYPE_ICON = { activities:'🎯', food:'🍽️', taxi:'🚌' };

  function _renderPaTable() {
    if (!paTbody) return;
    var sorted = _paData.slice().sort(function(a, b) {
      var av = a[_paSort.col], bv = b[_paSort.col];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return _paSort.asc ?  1 : -1;
      if (av > bv) return _paSort.asc ? -1 :  1;
      return 0;
    });
    paTbody.innerHTML = sorted.map(function(g) {
      var tierIcon = TIER_ICON[g.tier] || '';
      var typeIcon = TYPE_ICON[g.type] || '';
      var ctrColor = g.ctr >= 20 ? '#4ade80' : g.ctr >= 10 ? '#facc15' : '#94a3b8';
      return '<tr style="border-bottom:1px solid rgba(255,255,255,0.06)">' +
        '<td style="padding:0.4rem 0.5rem;font-weight:600">' + typeIcon + ' ' + _esc(g.name) + '</td>' +
        '<td style="padding:0.4rem 0.3rem;opacity:0.7">' + tierIcon + ' ' + _esc(g.tier) + '</td>' +
        '<td style="padding:0.4rem 0.3rem;opacity:0.7">' + _esc(g.category) + '</td>' +
        '<td style="padding:0.4rem 0.3rem;text-align:right">' + g.impressions + '</td>' +
        '<td style="padding:0.4rem 0.3rem;text-align:right">' + g.opens + '</td>' +
        '<td style="padding:0.4rem 0.3rem;text-align:right;color:#22d3ee">' + g.calls + '</td>' +
        '<td style="padding:0.4rem 0.3rem;text-align:right;color:#4ade80">' + g.whatsapp + '</td>' +
        '<td style="padding:0.4rem 0.3rem;text-align:right;color:#c084fc">' + g.bookings + '</td>' +
        '<td style="padding:0.4rem 0.3rem;text-align:right;font-weight:700;color:' + ctrColor + '">' + g.ctr + '%</td>' +
        '</tr>';
    }).join('');
  }

  // Column sort
  if (paTableEl) {
    paTableEl.querySelectorAll('th[data-sort]').forEach(function(th) {
      th.addEventListener('click', function() {
        var col = this.getAttribute('data-sort');
        if (_paSort.col === col) { _paSort.asc = !_paSort.asc; }
        else { _paSort.col = col; _paSort.asc = false; }
        _renderPaTable();
      });
    });
  }

  // CSV export
  function _exportCsvGrouped() {
    if (!_paData.length) { alert('Nema podataka za export.'); return; }
    var from = paFromEl ? paFromEl.value : '';
    var to   = paToEl   ? paToEl.value   : '';
    var header = ['Partner','Type','Tier','Category','Impressions','Opens','Calls','WhatsApp','Bookings','CTR%'];
    var rows = _paData.map(function(g) {
      return [
        '"' + g.name.replace(/"/g,'""') + '"',
        g.type, g.tier, g.category,
        g.impressions, g.opens, g.calls, g.whatsapp, g.bookings, g.ctr
      ].join(',');
    });
    var csv = header.join(',') + '\n' + rows.join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href     = url;
    a.download = 'partner_analytics_' + (from || 'all') + '_' + (to || 'all') + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (btnPaLoad)   btnPaLoad.addEventListener('click',   loadPartnerAnalytics);
  if (btnPaExport) btnPaExport.addEventListener('click',  _exportCsvGrouped);

  // ── MASTER: Maintenance reports prikaz ───────────────────────────────────
  var maintListEl    = document.getElementById('maint-list');
  var maintBadge     = document.getElementById('maint-badge');
  var btnMaintRefresh= document.getElementById('btn-maint-refresh');

  function loadMaintenanceReports() {
    if (!maintListEl) return;
    maintListEl.innerHTML = '<p style="opacity:0.45;font-size:0.82rem;margin:0">Učitavam…</p>';
    sb.from('maintenance_reports')
      .select('id, created_at, tenant_slug, category, location, description, is_read')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(function(r) {
        maintListEl.innerHTML = '';
        if (r.error) { maintListEl.innerHTML = '<p style="color:#f87171;font-size:0.82rem">' + r.error.message + '</p>'; return; }
        var rows = r.data || [];
        var unread = rows.filter(function(x){ return !x.is_read; }).length;
        if (maintBadge) { if (unread) { maintBadge.textContent = unread; maintBadge.style.display = 'inline'; } else { maintBadge.style.display = 'none'; } }
        if (!rows.length) { maintListEl.innerHTML = '<p style="opacity:0.4;font-size:0.82rem;margin:0">Nema prijava.</p>'; return; }
        var CAT_ICONS = { electric:'⚡', water:'🚿', wifi:'📶', cleaning:'🧹', appliance:'🔌', other:'🔧' };
        rows.forEach(function(row) {
          var d = document.createElement('div');
          d.style.cssText = 'background:rgba(255,255,255,' + (row.is_read ? '0.03' : '0.07') + ');border:1px solid rgba(249,115,22,' + (row.is_read ? '0.1' : '0.35') + ');border-radius:6px;padding:0.6rem;font-size:0.82rem;';
          var date = new Date(row.created_at).toLocaleString('sr-Latn');
          var icon = CAT_ICONS[row.category] || '🔧';
          d.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap">' +
            '<span style="font-weight:600">' + icon + ' ' + (row.category || '').toUpperCase() + (row.location ? ' — ' + _esc(row.location) : '') + '</span>' +
            '<span style="opacity:0.5;font-size:0.75rem">@' + _esc(row.tenant_slug) + ' · ' + date + '</span>' +
            '<div style="display:flex;gap:0.3rem;margin-left:auto">' +
            (!row.is_read ? '<button class="btn-secondary btn-sm mr-read" data-id="' + row.id + '">✓ Pročitano</button>' : '') +
            '<button class="btn-secondary btn-sm mr-del" data-id="' + row.id + '" style="color:#f87171;border-color:#f87171">🗑</button>' +
            '</div></div>' +
            (row.description ? '<div style="margin-top:0.4rem;white-space:pre-wrap;opacity:0.85">' + _esc(row.description) + '</div>' : '');
          var readBtn = d.querySelector('.mr-read');
          if (readBtn) {
            readBtn.addEventListener('click', function() {
              sb.from('maintenance_reports').update({ is_read: true }).eq('id', this.getAttribute('data-id')).then(function() { loadMaintenanceReports(); });
            });
          }
          d.querySelector('.mr-del').addEventListener('click', function() {
            sb.from('maintenance_reports').delete().eq('id', this.getAttribute('data-id')).then(function() { loadMaintenanceReports(); });
          });
          maintListEl.appendChild(d);
        });
      });
  }
  if (btnMaintRefresh) btnMaintRefresh.addEventListener('click', loadMaintenanceReports);

  // ── MASTER: Lost & Found prikaz ──────────────────────────────────────────
  var lfListEl    = document.getElementById('lf-list');
  var lfStatus    = document.getElementById('lf-status');
  var lfBadge     = document.getElementById('lf-badge');
  var btnLfRefresh= document.getElementById('btn-lf-refresh');

  function loadLostFound() {
    if (!lfListEl) return;
    lfListEl.innerHTML = '<p style="opacity:0.45;font-size:0.82rem;margin:0">Učitavam…</p>';
    var cutoff = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
    sb.from('lost_found_posts')
      .select('id, created_at, email, message, tenant_slug')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .then(function(r) {
        lfListEl.innerHTML = '';
        if (r.error) { lfListEl.innerHTML = '<p style="color:#f87171;font-size:0.82rem">' + r.error.message + '</p>'; return; }
        var rows = r.data || [];
        if (lfBadge) { if (rows.length) { lfBadge.textContent = rows.length; lfBadge.style.display = 'inline'; } else { lfBadge.style.display = 'none'; } }
        if (!rows.length) { lfListEl.innerHTML = '<p style="opacity:0.4;font-size:0.82rem;margin:0">Nema poruka.</p>'; return; }
        rows.forEach(function(row) {
          var d = document.createElement('div');
          d.style.cssText = 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:0.6rem;font-size:0.82rem;';
          var date = new Date(row.created_at).toLocaleString('sr-Latn');
          d.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap">' +
            '<span style="opacity:0.7">' + _esc(row.email) + (row.tenant_slug ? ' <em style="opacity:0.5">@' + _esc(row.tenant_slug) + '</em>' : '') + '</span>' +
            '<span style="opacity:0.5;font-size:0.75rem">' + date + '</span>' +
            '<button class="btn-secondary btn-sm lf-del" data-id="' + row.id + '" style="color:#f87171;border-color:#f87171;margin-left:auto">🗑 Obriši</button>' +
            '</div>' +
            '<div style="margin-top:0.4rem;white-space:pre-wrap">' + _esc(row.message) + '</div>';
          d.querySelector('.lf-del').addEventListener('click', function() {
            var id = this.getAttribute('data-id');
            sb.from('lost_found_posts').delete().eq('id', id).then(function() { loadLostFound(); });
          });
          lfListEl.appendChild(d);
        });
      });
  }
  if (btnLfRefresh) btnLfRefresh.addEventListener('click', loadLostFound);

  // ── MASTER: Predlozi gostiju ──────────────────────────────────────────────
  var suggListEl    = document.getElementById('sugg-list');
  var suggStatus    = document.getElementById('sugg-status');
  var suggBadge     = document.getElementById('sugg-badge');
  var btnSuggRefresh= document.getElementById('btn-sugg-refresh');

  function loadSuggestions() {
    if (!suggListEl) return;
    suggListEl.innerHTML = '<p style="opacity:0.45;font-size:0.82rem;margin:0">Učitavam…</p>';
    sb.from('suggestions')
      .select('id, created_at, lang, role, add_text, confusing, idea, tenant_slug, is_read')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(function(r) {
        suggListEl.innerHTML = '';
        if (r.error) { suggListEl.innerHTML = '<p style="color:#f87171;font-size:0.82rem">' + r.error.message + '</p>'; return; }
        var rows = r.data || [];
        var unread = rows.filter(function(x){ return !x.is_read; }).length;
        if (suggBadge) { if (unread) { suggBadge.textContent = unread; suggBadge.style.display = 'inline'; } else { suggBadge.style.display = 'none'; } }
        if (!rows.length) { suggListEl.innerHTML = '<p style="opacity:0.4;font-size:0.82rem;margin:0">Nema predloga.</p>'; return; }
        rows.forEach(function(row) {
          var d = document.createElement('div');
          d.style.cssText = 'background:rgba(255,255,255,' + (row.is_read ? '0.03' : '0.07') + ');border:1px solid rgba(255,255,255,' + (row.is_read ? '0.08' : '0.2') + ');border-radius:6px;padding:0.6rem;font-size:0.82rem;';
          var date = new Date(row.created_at).toLocaleString('sr-Latn');
          var parts = [];
          if (row.add_text)  parts.push('<strong>Šta dodati:</strong> ' + _esc(row.add_text));
          if (row.confusing) parts.push('<strong>Nejasno:</strong> ' + _esc(row.confusing));
          if (row.idea)      parts.push('<strong>Ideja:</strong> ' + _esc(row.idea));
          d.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap">' +
            '<span style="opacity:0.6">' + (row.role || 'guest') + ' / ' + (row.lang || '?') + (row.tenant_slug ? ' @' + _esc(row.tenant_slug) : '') + '</span>' +
            '<span style="opacity:0.5;font-size:0.75rem">' + date + '</span>' +
            '<div style="display:flex;gap:0.3rem;margin-left:auto">' +
            (!row.is_read ? '<button class="btn-secondary btn-sm sugg-read" data-id="' + row.id + '">✓ Pročitano</button>' : '') +
            '<button class="btn-secondary btn-sm sugg-del" data-id="' + row.id + '" style="color:#f87171;border-color:#f87171">🗑</button>' +
            '</div></div>' +
            '<div style="margin-top:0.4rem;line-height:1.6">' + parts.join('<br>') + '</div>';
          var readBtn = d.querySelector('.sugg-read');
          if (readBtn) {
            readBtn.addEventListener('click', function() {
              var id = this.getAttribute('data-id');
              sb.from('suggestions').update({ is_read: true }).eq('id', id).then(function() { loadSuggestions(); });
            });
          }
          d.querySelector('.sugg-del').addEventListener('click', function() {
            var id = this.getAttribute('data-id');
            sb.from('suggestions').delete().eq('id', id).then(function() { loadSuggestions(); });
          });
          suggListEl.appendChild(d);
        });
      });
  }
  if (btnSuggRefresh) btnSuggRefresh.addEventListener('click', loadSuggestions);

  // ── MASTER: Global site settings (site name + subtitle + email) ───────────
  var globalSiteNameInput     = document.getElementById('global-site-name');
  var globalSiteSubtitleInput = document.getElementById('global-site-subtitle');
  var globalAdminEmailInput   = document.getElementById('global-admin-email');
  var globalW3fKeyInput       = document.getElementById('global-w3f-key');
  var globalSettingsStatus    = document.getElementById('global-settings-status');
  var btnGlobalSettingsSave   = document.getElementById('btn-global-settings-save');

  function loadGlobalSettings() {
    sb.from('items')
      .select('data_json')
      .eq('section_key', 'ui')
      .eq('item_key', 'site_name')
      .is('tenant_id', null)
      .maybeSingle()
      .then(function (r) {
        if (r.error || !r.data) return;
        var dj = r.data.data_json || {};
        if (globalSiteNameInput     && dj.name)     globalSiteNameInput.value     = dj.name;
        if (globalSiteSubtitleInput && dj.subtitle) globalSiteSubtitleInput.value = dj.subtitle;
        if (globalAdminEmailInput   && dj.admin_email) globalAdminEmailInput.value = dj.admin_email;
        if (globalW3fKeyInput       && dj.w3f_key)    globalW3fKeyInput.value     = dj.w3f_key;
      });
  }

  function saveGlobalSettings() {
    var name       = globalSiteNameInput     ? globalSiteNameInput.value.trim()     : '';
    var subtitle   = globalSiteSubtitleInput ? globalSiteSubtitleInput.value.trim() : '';
    var adminEmail = globalAdminEmailInput   ? globalAdminEmailInput.value.trim()   : '';
    var w3fKey     = globalW3fKeyInput       ? globalW3fKeyInput.value.trim()       : '';
    if (!name) { setStatus(globalSettingsStatus, 'Naziv ne može biti prazan.', 'error'); return; }
    if (btnGlobalSettingsSave) btnGlobalSettingsSave.disabled = true;
    setStatus(globalSettingsStatus, 'Čuvam…', '');
    sb.from('items').upsert({
      tenant_id: null, section_key: 'ui', item_key: 'site_name',
      type: 'config', order: 1, visible: true,
      data_json: { name: name, subtitle: subtitle, admin_email: adminEmail, w3f_key: w3fKey },
      municipality_slugs: null, updated_at: new Date().toISOString()
    }, { onConflict: 'tenant_id,section_key,item_key' })
      .then(function (r) {
        if (btnGlobalSettingsSave) btnGlobalSettingsSave.disabled = false;
        if (r.error) { setStatus(globalSettingsStatus, 'Greška: ' + r.error.message, 'error'); return; }
        setStatus(globalSettingsStatus, 'Sačuvano ✓', 'success');
      }).catch(function (err) {
        if (btnGlobalSettingsSave) btnGlobalSettingsSave.disabled = false;
        setStatus(globalSettingsStatus, 'Greška: ' + (err && err.message ? err.message : err), 'error');
      });
  }

  if (btnGlobalSettingsSave) btnGlobalSettingsSave.addEventListener('click', saveGlobalSettings);

  // ── MASTER: Analytics ─────────────────────────────────────────────────────
  function loadAnalytics() {
    if (!analyticsOutput) return;
    analyticsOutput.textContent = 'Učitavam…';
    var since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    sb.from('analytics')
      .select('event_type, tenant_slug, card_id, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .then(function (r) {
        if (r.error) {
          console.error('[Analytics] error:', r.error.code, r.error.message, r.error);
          analyticsOutput.innerHTML =
            '<em style="color:#f87171">Greška: ' + r.error.message +
            ' (code: ' + (r.error.code || '—') + ')</em>';
          return;
        }
        var rows = r.data || [];
        console.log('[Analytics] rows fetched:', rows.length,
          '| columns:', rows.length ? Object.keys(rows[0]).join(', ') : '—');
        renderAnalytics(rows);
      })
      .catch(function (err) {
        console.error('[Analytics] catch:', err);
        analyticsOutput.textContent = 'Neočekivana greška: ' + (err && err.message ? err.message : err);
      });
  }

  function renderAnalytics(rows) {
    var views  = rows.filter(function (r) { return r.event_type === 'page_view'; }).length;
    var clicks = rows.filter(function (r) { return r.event_type === 'card_click'; }).length;

    // Group by tenant_slug (the exact column name from the DB)
    var byTenant = {};
    rows.forEach(function (r) {
      var slug = r.tenant_slug || '—';
      if (!byTenant[slug]) byTenant[slug] = { views: 0, clicks: 0 };
      if (r.event_type === 'page_view')  byTenant[slug].views++;
      if (r.event_type === 'card_click') byTenant[slug].clicks++;
    });

    // Group by card_id, sort by click count descending
    var byCard = {};
    rows.forEach(function (r) {
      if (r.event_type !== 'card_click') return;
      var cid = r.card_id || '—';
      byCard[cid] = (byCard[cid] || 0) + 1;
    });

    var td  = 'padding:0.25rem 0.6rem;';
    var tdR = td + 'text-align:right;';
    var noData3 = '<tr><td colspan="3" style="' + td + 'opacity:0.45">Nema podataka</td></tr>';
    var noData2 = '<tr><td colspan="2" style="' + td + 'opacity:0.45">Nema podataka</td></tr>';

    // Sort tenants: most total events first
    var tenantRows = Object.keys(byTenant)
      .sort(function (a, b) {
        return (byTenant[b].views + byTenant[b].clicks) - (byTenant[a].views + byTenant[a].clicks);
      })
      .map(function (slug) {
        var d = byTenant[slug];
        return '<tr>' +
          '<td style="' + td  + '">' + slug + '</td>' +
          '<td style="' + tdR + '">' + d.views + '</td>' +
          '<td style="' + tdR + '">' + d.clicks + '</td>' +
          '</tr>';
      }).join('') || noData3;

    var cardRows = Object.keys(byCard)
      .sort(function (a, b) { return byCard[b] - byCard[a]; })
      .map(function (cid) {
        return '<tr>' +
          '<td style="' + td  + '">' + cid + '</td>' +
          '<td style="' + tdR + '">' + byCard[cid] + '</td>' +
          '</tr>';
      }).join('') || noData2;

    var th  = 'text-align:left;'  + td + 'opacity:0.55;font-weight:600;border-bottom:1px solid rgba(255,255,255,0.1)';
    var thR = 'text-align:right;' + td + 'opacity:0.55;font-weight:600;border-bottom:1px solid rgba(255,255,255,0.1)';
    var tbl = 'width:100%;border-collapse:collapse;margin-top:0.4rem;font-size:0.82rem';

    analyticsOutput.innerHTML =
      '<strong>Poslednjih 30 dana</strong><br>' +
      '📄 Pregleda: <strong>' + views + '</strong>' +
      ' &nbsp;|&nbsp; 🖱️ Klikova: <strong>' + clicks + '</strong>' +
      ' &nbsp;|&nbsp; Ukupno eventa: <strong>' + rows.length + '</strong>' +
      '<br><br><strong>Po apartmanu (tenant_slug):</strong>' +
      '<table style="' + tbl + '">' +
      '<thead><tr>' +
      '<th style="' + th  + '">Slug apartmana</th>' +
      '<th style="' + thR + '">Posete</th>' +
      '<th style="' + thR + '">Klikovi</th>' +
      '</tr></thead><tbody>' + tenantRows + '</tbody></table>' +
      '<br><strong>Top kartice (klikovi):</strong>' +
      '<table style="' + tbl + '">' +
      '<thead><tr>' +
      '<th style="' + th  + '">Kartica (card_id)</th>' +
      '<th style="' + thR + '">Klikovi</th>' +
      '</tr></thead><tbody>' + cardRows + '</tbody></table>';
  }

  // ── MASTER: Taxi services (global) ───────────────────────────────────────────
  var taxiListEl     = document.getElementById('taxi-services-list');
  var taxiSaveStatus = document.getElementById('taxi-save-status');
  var btnTaxiAdd     = document.getElementById('btn-taxi-add');
  var btnTaxiSave    = document.getElementById('btn-taxi-save');

  function _buildTaxiRow(item, idx) {
    var dj  = item ? (item.data_json || {}) : {};
    var row = document.createElement('div');
    row.className = 'emergency-row';
    row.dataset.id      = item ? (item.id      || '') : '';
    row.dataset.itemKey = item ? (item.item_key || '') : '';
    row.style.cssText =
      'background:rgba(255,255,255,0.06);border-radius:8px;padding:0.65rem;' +
      'display:flex;flex-direction:column;gap:0.35rem;';
    row.innerHTML =
      '<div style="display:flex;gap:0.5rem;align-items:center">' +
        '<span style="font-size:0.72rem;opacity:0.45;min-width:1.4rem">#' + (idx + 1) + '</span>' +
        '<input data-field="name" style="flex:1" type="text" placeholder="Naziv taxi firme" value="' + _escHtml(dj.name) + '"/>' +
        '<button data-action="delete" style="background:none;border:1px solid rgba(255,80,80,0.35);' +
          'color:#f87171;border-radius:5px;padding:0.15rem 0.45rem;cursor:pointer;font-size:0.78rem">✕</button>' +
      '</div>' +
      '<input data-field="phone" type="text" placeholder="Prikaz broja — npr. +386 30 123 456" value="' + _escHtml(dj.phone) + '"/>' +
      '<input data-field="tel"   type="text" placeholder="tel: link — npr. tel:+38630123456"    value="' + _escHtml(dj.tel)   + '"/>' +
      _buildMunHtml(item ? (item.municipality_slugs || null) : ['bovec']);
    return row;
  }

  function renderTaxiAdmin(items) {
    if (!taxiListEl) return;
    if (!items || !items.length) {
      taxiListEl.innerHTML =
        '<p style="opacity:0.45;font-size:0.82rem;margin:0">Nema taxi firmi. Klikni "+ Dodaj firmu".</p>';
      return;
    }
    taxiListEl.innerHTML = '';
    items.forEach(function (item, idx) { taxiListEl.appendChild(_buildTaxiRow(item, idx)); });
    _applyMunFilter();
  }

  function loadTaxiServices() {
    if (!taxiListEl) return;
    taxiListEl.innerHTML = '<p style="opacity:0.45;font-size:0.82rem;margin:0">Učitavam…</p>';
    sb.from('items')
      .select('id, item_key, "order", municipality_slugs, data_json')
      .eq('section_key', 'taxi')
      .is('tenant_id', null)
      .order('order', { ascending: true })
      .then(function (r) {
        if (r.error) {
          taxiListEl.innerHTML =
            '<em style="color:#f87171;font-size:0.83rem">Greška: ' + r.error.message + '</em>';
          return;
        }
        renderTaxiAdmin(r.data || []);
      })
      .catch(function () {
        if (taxiListEl)
          taxiListEl.innerHTML = '<em style="color:#f87171;font-size:0.83rem">Neočekivana greška</em>';
      });
  }

  function _addTaxiRow() {
    if (!taxiListEl) return;
    var idx = taxiListEl.querySelectorAll('.emergency-row').length;
    taxiListEl.appendChild(_buildTaxiRow(null, idx));
    var newRow = taxiListEl.lastElementChild;
    _preCheckMun(newRow);
    newRow.querySelector('[data-field=name]').focus();
  }

  function _deleteTaxiRow(rowEl) {
    var id = rowEl.dataset.id;
    if (id) {
      sb.from('items').delete().eq('id', id).then(function (r) {
        if (r.error) {
          setStatus(taxiSaveStatus, 'Greška pri brisanju: ' + r.error.message, 'error');
          return;
        }
        loadTaxiServices();
      });
    } else {
      rowEl.remove();
    }
  }

  function saveTaxiServices() {
    if (!taxiListEl) return;
    var rows   = taxiListEl.querySelectorAll('.emergency-row');
    var parsed = [];
    rows.forEach(function (row, idx) {
      parsed.push({
        id:      row.dataset.id || null,
        itemKey: row.dataset.itemKey || '',
        order:   idx + 1,
        municipalitySlugs: _getMunSlugs(row),
        dataJson: {
          name:  row.querySelector('[data-field=name]').value.trim(),
          phone: row.querySelector('[data-field=phone]').value.trim(),
          tel:   row.querySelector('[data-field=tel]').value.trim()
        }
      });
    });
    if (!parsed.length) return;

    if (btnTaxiSave) btnTaxiSave.disabled = true;
    setStatus(taxiSaveStatus, 'Snimam…', 'info');

    ensureSectionExists('taxi').then(function () {
      var now = new Date().toISOString();
      var promises = parsed.map(function (p) {
        if (p.id) {
          return sb.from('items')
            .update({ data_json: p.dataJson, 'order': p.order, municipality_slugs: p.municipalitySlugs, updated_at: now })
            .eq('id', p.id);
        }
        var newKey = 'taxi-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
        return sb.from('items').insert({
          tenant_id: null, section_key: 'taxi', item_key: newKey,
          type: 'taxi_service', 'order': p.order, visible: true,
          municipality_slugs: p.municipalitySlugs,
          data_json: p.dataJson, updated_at: now
        });
      });
      return Promise.all(promises);
    }).then(function (results) {
      if (btnTaxiSave) btnTaxiSave.disabled = false;
      var errs = results
        .filter(function (r) { return r && r.error; })
        .map(function (r) { return r.error.message; });
      if (errs.length) { setStatus(taxiSaveStatus, 'Greška: ' + errs.join('; '), 'error'); return; }
      setStatus(taxiSaveStatus, 'Sačuvano! ✓', 'info');
      loadTaxiServices();
    }).catch(function (err) {
      if (btnTaxiSave) btnTaxiSave.disabled = false;
      setStatus(taxiSaveStatus, 'Greška: ' + (err && err.message ? err.message : err), 'error');
    });
  }

  if (taxiListEl) {
    taxiListEl.addEventListener('click', function (e) {
      if (e.target.dataset.action === 'delete') {
        var row = e.target.closest('.emergency-row');
        if (row) _deleteTaxiRow(row);
      }
    });
  }
  if (btnTaxiAdd)  btnTaxiAdd.addEventListener('click',  _addTaxiRow);
  if (btnTaxiSave) btnTaxiSave.addEventListener('click', saveTaxiServices);

  // ── MASTER: Restaurants (global) ─────────────────────────────────────────────
  var restaurantsListEl    = document.getElementById('restaurants-list');
  var restaurantsSaveStatus = document.getElementById('restaurants-save-status');
  var btnRestaurantsAdd    = document.getElementById('btn-restaurants-add');
  var btnRestaurantsSave   = document.getElementById('btn-restaurants-save');

  var REST_TYPE_OPTIONS  = ['gostilna','restavracija','kavarna','pizzerija','bar','bistro','brewery','hotel','street'];
  var REST_PLACE_OPTIONS = ['bovec','kot','mala_vas','mala vas','ledina','cezsoca','log_cezsoski','log_mangart','lepena'];

  function _buildRestPlaceSelect(selected) {
    var places = ['bovec','kot','mala_vas','ledina','cezsoca','log_cezsoski','log_mangart','lepena'];
    return '<select data-field="place" style="width:auto;padding:0.3rem 0.5rem;font-size:0.82rem">' +
      places.map(function (p) {
        return '<option value="' + p + '"' + (p === selected ? ' selected' : '') + '>' + p + '</option>';
      }).join('') + '</select>';
  }

  function _buildRestTypeSelect(selected) {
    return '<select data-field="type" style="width:auto;padding:0.3rem 0.5rem;font-size:0.82rem">' +
      REST_TYPE_OPTIONS.map(function (t) {
        return '<option value="' + t + '"' + (t === selected ? ' selected' : '') + '>' + t + '</option>';
      }).join('') + '</select>';
  }

  function _buildRestaurantRow(item, idx) {
    var dj = item ? (item.data_json || {}) : {};
    var div = document.createElement('div');
    div.className = 'emergency-row';
    div.dataset.idx = idx;
    div.innerHTML =
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.4rem 0.6rem;width:100%">' +
        '<input data-field="name"    placeholder="Naziv"       value="' + _escHtml(dj.name    || '') + '" style="grid-column:1/-1">' +
        _buildRestTypeSelect(dj.type  || 'restavracija') +
        _buildRestPlaceSelect(dj.place || 'bovec') +
        '<input data-field="address" placeholder="Adresa"      value="' + _escHtml(dj.address || '') + '" style="grid-column:1/-1">' +
        '<input data-field="phone"   placeholder="Tel (opcionalno)" value="' + _escHtml(dj.phone || '') + '">' +
        '<label style="display:flex;align-items:center;gap:0.3rem;font-size:0.82rem">' +
          '<input type="checkbox" data-field="active"' + (item && item.visible !== false ? ' checked' : '') + '> Aktivan' +
        '</label>' +
        '<div style="grid-column:1/-1">' + _buildMunHtml(item ? (item.municipality_slugs || null) : ['bovec']) + '</div>' +
      '</div>' +
      '<button data-action="delete" class="btn-danger btn-sm" style="align-self:flex-start;flex-shrink:0">🗑</button>';
    return div;
  }

  function renderRestaurantsAdmin(items) {
    if (!restaurantsListEl) return;
    if (!items || !items.length) {
      restaurantsListEl.innerHTML = '<p style="opacity:0.45;font-size:0.82rem;margin:0">Nema unetih restorana.</p>';
      return;
    }
    restaurantsListEl.innerHTML = '';
    items.forEach(function (item, idx) { restaurantsListEl.appendChild(_buildRestaurantRow(item, idx)); });
    _applyMunFilter();
  }

  function loadRestaurants() {
    if (!restaurantsListEl) return;
    restaurantsListEl.innerHTML = '<p style="opacity:0.45;font-size:0.82rem;margin:0">Učitavam…</p>';
    sb.from('items')
      .select('id, item_key, "order", visible, municipality_slugs, data_json')
      .eq('section_key', 'restaurants')
      .is('tenant_id', null)
      .order('order', { ascending: true })
      .then(function (r) {
        if (r.error) { restaurantsListEl.innerHTML = '<p style="color:red;font-size:0.82rem">Greška: ' + r.error.message + '</p>'; return; }
        renderRestaurantsAdmin(r.data || []);
      });
  }

  function _addRestaurantRow() {
    var idx = restaurantsListEl ? restaurantsListEl.querySelectorAll('.emergency-row').length : 0;
    var row = _buildRestaurantRow(null, idx);
    if (restaurantsListEl) {
      restaurantsListEl.appendChild(row);
      _preCheckMun(row);
    }
  }

  function _deleteRestaurantRow(row) {
    var idx = parseInt(row.dataset.idx, 10);
    if (!confirm('Obrisati ovaj restoran?')) return;
    var rows = restaurantsListEl.querySelectorAll('.emergency-row');
    if (idx < rows.length) {
      var existingId = rows[idx] && rows[idx].dataset.dbId;
      if (existingId) {
        sb.from('items').delete().eq('id', existingId).then(function () { loadRestaurants(); });
      } else {
        row.remove();
      }
    }
  }

  function saveRestaurants() {
    if (!restaurantsListEl) return;
    if (btnRestaurantsSave) btnRestaurantsSave.disabled = true;
    setStatus(restaurantsSaveStatus, 'Čuvam…', '');
    var rows = restaurantsListEl.querySelectorAll('.emergency-row');
    var upserts = [];
    rows.forEach(function (row, idx) {
      var get = function (f) { var el = row.querySelector('[data-field="' + f + '"]'); return el ? (el.type === 'checkbox' ? el.checked : el.value.trim()) : ''; };
      var name = get('name');
      if (!name) return;
      var slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      upserts.push({
        tenant_id: null,
        section_key: 'restaurants',
        item_key: slug || ('rest-' + idx),
        type: 'restaurant',
        order: idx + 1,
        visible: get('active'),
        municipality_slugs: _getMunSlugs(row),
        data_json: { name: name, type: get('type'), place: get('place'), address: get('address'), phone: get('phone') },
        updated_at: new Date().toISOString()
      });
    });
    if (!upserts.length) {
      if (btnRestaurantsSave) btnRestaurantsSave.disabled = false;
      setStatus(restaurantsSaveStatus, 'Nema podataka za čuvanje.', 'error');
      return;
    }
    sb.from('items').upsert(upserts, { onConflict: 'tenant_id,section_key,item_key', ignoreDuplicates: false })
      .then(function (r) {
        if (btnRestaurantsSave) btnRestaurantsSave.disabled = false;
        if (r.error) { setStatus(restaurantsSaveStatus, 'Greška: ' + r.error.message, 'error'); return; }
        setStatus(restaurantsSaveStatus, 'Sačuvano ✓', 'success');
        loadRestaurants();
      }).catch(function (err) {
        if (btnRestaurantsSave) btnRestaurantsSave.disabled = false;
        setStatus(restaurantsSaveStatus, 'Greška: ' + (err && err.message ? err.message : err), 'error');
      });
  }

  if (restaurantsListEl) {
    restaurantsListEl.addEventListener('click', function (e) {
      if (e.target.dataset.action === 'delete') {
        var row = e.target.closest('.emergency-row');
        if (row) _deleteRestaurantRow(row);
      }
    });
  }
  if (btnRestaurantsAdd)  btnRestaurantsAdd.addEventListener('click',  _addRestaurantRow);
  if (btnRestaurantsSave) btnRestaurantsSave.addEventListener('click', saveRestaurants);

  // ── MASTER: Adrenalin providers (global) ─────────────────────────────────────
  var adrenalinListEl      = document.getElementById('adrenalin-providers-list');
  var adrenalinSaveStatus  = document.getElementById('adrenalin-save-status');
  var btnAdrenalinAdd      = document.getElementById('btn-adrenalin-add');
  var btnAdrenalinSave     = document.getElementById('btn-adrenalin-save');

  var TIER_OPTIONS = ['free', 'featured', 'premium'];

  function _buildTierSelect(selected) {
    return '<select data-field="tier" style="width:auto;padding:0.3rem 0.5rem;font-size:0.82rem">' +
      TIER_OPTIONS.map(function (t) {
        return '<option value="' + t + '"' + (t === selected ? ' selected' : '') + '>' + t + '</option>';
      }).join('') + '</select>';
  }

  function _buildProviderRow(item, idx) {
    var dj  = item ? (item.data_json || {}) : {};
    var row = document.createElement('div');
    row.className = 'emergency-row'; // reuse same card style
    row.dataset.id      = item ? (item.id      || '') : '';
    row.dataset.itemKey = item ? (item.item_key || '') : '';
    row.style.cssText =
      'background:rgba(255,255,255,0.06);border-radius:8px;padding:0.65rem;' +
      'display:flex;flex-direction:column;gap:0.35rem;';
    row.innerHTML =
      '<div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">' +
        '<span style="font-size:0.72rem;opacity:0.45;min-width:1.4rem">#' + (idx + 1) + '</span>' +
        '<input data-field="name" style="flex:1;min-width:120px" type="text" placeholder="Naziv provajdera" value="' + _escHtml(dj.name) + '"/>' +
        _buildTierSelect(dj.tier || 'free') +
        '<label style="display:flex;align-items:center;gap:0.3rem;font-size:0.82rem;cursor:pointer;white-space:nowrap">' +
          '<input data-field="active" type="checkbox"' + (dj.active !== false ? ' checked' : '') + '/> Aktivan' +
        '</label>' +
        '<button data-action="delete" style="background:none;border:1px solid rgba(255,80,80,0.35);' +
          'color:#f87171;border-radius:5px;padding:0.15rem 0.45rem;cursor:pointer;font-size:0.78rem">✕</button>' +
      '</div>' +
      '<input data-field="banner_text" type="text" placeholder="Tagovi — npr. Rafting \u2022 Kayaking" value="' + _escHtml(dj.banner_text) + '"/>' +
      '<input data-field="website"     type="text" placeholder="Website (https://...)"                  value="' + _escHtml(dj.website)     + '"/>' +
      '<input data-field="maps_url"    type="text" placeholder="Google Maps link (opciono)"             value="' + _escHtml(dj.maps_url)    + '"/>' +
      _buildMunHtml(item ? (item.municipality_slugs || null) : ['bovec']);
    return row;
  }

  function renderAdrenalinAdmin(items) {
    if (!adrenalinListEl) return;
    if (!items || !items.length) {
      adrenalinListEl.innerHTML =
        '<p style="opacity:0.45;font-size:0.82rem;margin:0">Nema provajdera. Klikni "+ Dodaj provajdera".</p>';
      return;
    }
    adrenalinListEl.innerHTML = '';
    items.forEach(function (item, idx) {
      adrenalinListEl.appendChild(_buildProviderRow(item, idx));
    });
    _applyMunFilter();
  }

  function loadAdrenalinProviders() {
    if (!adrenalinListEl) return;
    adrenalinListEl.innerHTML =
      '<p style="opacity:0.45;font-size:0.82rem;margin:0">Učitavam…</p>';
    sb.from('items')
      .select('id, item_key, "order", municipality_slugs, data_json')
      .eq('section_key', 'adrenalin')
      .is('tenant_id', null)
      .order('order', { ascending: true })
      .then(function (r) {
        if (r.error) {
          adrenalinListEl.innerHTML =
            '<em style="color:#f87171;font-size:0.83rem">Greška: ' + r.error.message + '</em>';
          return;
        }
        renderAdrenalinAdmin(r.data || []);
      })
      .catch(function () {
        if (adrenalinListEl)
          adrenalinListEl.innerHTML =
            '<em style="color:#f87171;font-size:0.83rem">Neočekivana greška</em>';
      });
  }

  function _addAdrenalinRow() {
    if (!adrenalinListEl) return;
    var idx = adrenalinListEl.querySelectorAll('.emergency-row').length;
    adrenalinListEl.appendChild(_buildProviderRow(null, idx));
    var newRow = adrenalinListEl.lastElementChild;
    _preCheckMun(newRow);
    newRow.querySelector('[data-field=name]').focus();
  }

  function _deleteAdrenalinRow(rowEl) {
    var id = rowEl.dataset.id;
    if (id) {
      sb.from('items').delete().eq('id', id).then(function (r) {
        if (r.error) {
          setStatus(adrenalinSaveStatus, 'Greška pri brisanju: ' + r.error.message, 'error');
          return;
        }
        loadAdrenalinProviders();
      });
    } else {
      rowEl.remove();
    }
  }

  function saveAdrenalinProviders() {
    if (!adrenalinListEl) return;
    var rows   = adrenalinListEl.querySelectorAll('.emergency-row');
    var parsed = [];
    rows.forEach(function (row, idx) {
      var activeEl = row.querySelector('[data-field=active]');
      parsed.push({
        id:      row.dataset.id || null,
        itemKey: row.dataset.itemKey || '',
        order:   idx + 1,
        municipalitySlugs: _getMunSlugs(row),
        dataJson: {
          name:        row.querySelector('[data-field=name]').value.trim(),
          banner_text: row.querySelector('[data-field=banner_text]').value.trim(),
          website:     row.querySelector('[data-field=website]').value.trim(),
          maps_url:    row.querySelector('[data-field=maps_url]').value.trim(),
          tier:        row.querySelector('[data-field=tier]').value,
          active:      activeEl ? activeEl.checked : true,
          priority:    0,
          weight:      1,
          categories:  []
        }
      });
    });
    if (!parsed.length) return;

    if (btnAdrenalinSave) btnAdrenalinSave.disabled = true;
    setStatus(adrenalinSaveStatus, 'Snimam…', 'info');

    ensureSectionExists('adrenalin').then(function () {
      var now = new Date().toISOString();
      var promises = parsed.map(function (p) {
        if (p.id) {
          return sb.from('items')
            .update({ data_json: p.dataJson, 'order': p.order, municipality_slugs: p.municipalitySlugs, updated_at: now })
            .eq('id', p.id);
        }
        var newKey = 'provider-' + Date.now() + '-' +
                     Math.random().toString(36).slice(2, 7);
        return sb.from('items').insert({
          tenant_id: null, section_key: 'adrenalin', item_key: newKey,
          type: 'adrenalin_provider', 'order': p.order, visible: true,
          municipality_slugs: p.municipalitySlugs,
          data_json: p.dataJson, updated_at: now
        });
      });
      return Promise.all(promises);
    }).then(function (results) {
      if (btnAdrenalinSave) btnAdrenalinSave.disabled = false;
      var errs = results
        .filter(function (r) { return r && r.error; })
        .map(function (r) { return r.error.message; });
      if (errs.length) {
        setStatus(adrenalinSaveStatus, 'Greška: ' + errs.join('; '), 'error');
        return;
      }
      setStatus(adrenalinSaveStatus, 'Sačuvano! ✓', 'info');
      loadAdrenalinProviders();
    }).catch(function (err) {
      if (btnAdrenalinSave) btnAdrenalinSave.disabled = false;
      setStatus(adrenalinSaveStatus, 'Greška: ' + (err && err.message ? err.message : err), 'error');
    });
  }

  if (adrenalinListEl) {
    adrenalinListEl.addEventListener('click', function (e) {
      if (e.target.dataset.action === 'delete') {
        var row = e.target.closest('.emergency-row');
        if (row) _deleteAdrenalinRow(row);
      }
    });
  }
  if (btnAdrenalinAdd)  btnAdrenalinAdd.addEventListener('click',  _addAdrenalinRow);
  if (btnAdrenalinSave) btnAdrenalinSave.addEventListener('click', saveAdrenalinProviders);

  // ── MASTER: Emergency services (global) ──────────────────────────────────────
  var emergencyListEl      = document.getElementById('emergency-services-list');
  var emergencySaveStatus  = document.getElementById('emergency-save-status');
  var btnEmergencyAdd      = document.getElementById('btn-emergency-add');
  var btnEmergencySave     = document.getElementById('btn-emergency-save');

  var _escHtml = _esc;

  // ── Municipality helpers ──────────────────────────────────────────────────
  var KNOWN_MUNICIPALITIES = ['bovec', 'kobarid', 'tolmin'];

  function _buildMunHtml(slugs) {
    // slugs = array e.g. ['bovec','kobarid'] | null = show everywhere
    var isAll = !slugs || !slugs.length;
    var boxes = KNOWN_MUNICIPALITIES.map(function (m) {
      var chk = (!isAll && slugs.indexOf(m) >= 0) ? ' checked' : '';
      return '<label style="white-space:nowrap"><input type="checkbox" data-mun="' + m + '"' + chk + '> ' + m + '</label>';
    }).join('');
    return '<div data-mun-group style="display:flex;gap:0.5rem;flex-wrap:wrap;font-size:0.78rem;padding-top:0.25rem;align-items:center">' +
      '<span style="opacity:0.5;font-size:0.75rem">Opštine:</span>' + boxes +
      '<label style="white-space:nowrap"><input type="checkbox" data-mun="svuda"' + (isAll ? ' checked' : '') + '> Svuda</label>' +
    '</div>';
  }

  function _getMunSlugs(row) {
    var allBox = row.querySelector('[data-mun="svuda"]');
    if (allBox && allBox.checked) return null; // null → shown in all municipalities
    var slugs = [];
    KNOWN_MUNICIPALITIES.forEach(function (m) {
      var cb = row.querySelector('[data-mun="' + m + '"]');
      if (cb && cb.checked) slugs.push(m);
    });
    return slugs.length ? slugs : ['bovec'];
  }

  function _applyMunFilter() {
    var val = munFilterSelect ? munFilterSelect.value : '';
    var lists = [emergencyListEl];
    lists.forEach(function (list) {
      if (!list) return;
      list.querySelectorAll('.emergency-row').forEach(function (row) {
        if (!val) { row.style.display = ''; return; }
        var svuda = row.querySelector('[data-mun="svuda"]');
        if (svuda && svuda.checked) { row.style.display = ''; return; }
        var cb = row.querySelector('[data-mun="' + val + '"]');
        row.style.display = (cb && cb.checked) ? '' : 'none';
      });
    });
  }

  function _preCheckMun(row) {
    var val = munFilterSelect ? munFilterSelect.value : '';
    if (!val) return;
    KNOWN_MUNICIPALITIES.forEach(function (m) {
      var cb = row.querySelector('[data-mun="' + m + '"]');
      if (cb) cb.checked = (m === val);
    });
    var svuda = row.querySelector('[data-mun="svuda"]');
    if (svuda) svuda.checked = false;
  }

  if (munFilterSelect) munFilterSelect.addEventListener('change', _applyMunFilter);

  function renderEmergencyAdmin(items) {
    if (!emergencyListEl) return;
    if (!items || !items.length) {
      emergencyListEl.innerHTML =
        '<p style="opacity:0.45;font-size:0.82rem;margin:0">Nema servisa. Klikni "+ Dodaj servis".</p>';
      return;
    }
    emergencyListEl.innerHTML = '';
    items.forEach(function (item, idx) {
      var dj = item.data_json || {};
      var row = document.createElement('div');
      row.className = 'emergency-row';
      row.dataset.id      = item.id      || '';
      row.dataset.itemKey = item.item_key || '';
      row.style.cssText =
        'background:rgba(255,255,255,0.06);border-radius:8px;padding:0.65rem;' +
        'display:flex;flex-direction:column;gap:0.35rem;';
      row.innerHTML =
        '<div style="display:flex;gap:0.5rem;align-items:center">' +
          '<span style="font-size:0.72rem;opacity:0.45;min-width:1.4rem">#' + (idx + 1) + '</span>' +
          '<input data-field="name" style="flex:1" type="text" placeholder="Naziv servisa" value="' + _escHtml(dj.name) + '"/>' +
          '<button data-action="delete" style="background:none;border:1px solid rgba(255,80,80,0.35);' +
            'color:#f87171;border-radius:5px;padding:0.15rem 0.45rem;cursor:pointer;font-size:0.78rem">✕</button>' +
        '</div>' +
        '<input data-field="phone"      type="text" placeholder="Telefon (+386 ...)"          value="' + _escHtml(dj.phone)      + '"/>' +
        '<input data-field="address"    type="text" placeholder="Adresa (opciono)"             value="' + _escHtml(dj.address)    + '"/>' +
        '<input data-field="tel"        type="text" placeholder="tel: link — npr. tel:+38656…" value="' + _escHtml(dj.tel)        + '"/>' +
        '<input data-field="directions" type="text" placeholder="Google Maps link"             value="' + _escHtml(dj.directions) + '"/>' +
        _buildMunHtml(item.municipality_slugs || null);
      emergencyListEl.appendChild(row);
    });
    _applyMunFilter();
  }

  function loadEmergencyItems() {
    if (!emergencyListEl) return;
    emergencyListEl.innerHTML =
      '<p style="opacity:0.45;font-size:0.82rem;margin:0">Učitavam…</p>';
    sb.from('items')
      .select('id, item_key, "order", municipality_slugs, data_json')
      .eq('section_key', 'emergency')
      .is('tenant_id', null)
      .order('order', { ascending: true })
      .then(function (r) {
        if (r.error) {
          emergencyListEl.innerHTML =
            '<em style="color:#f87171;font-size:0.83rem">Greška: ' + r.error.message + '</em>';
          return;
        }
        renderEmergencyAdmin(r.data || []);
      })
      .catch(function (err) {
        if (emergencyListEl)
          emergencyListEl.innerHTML =
            '<em style="color:#f87171;font-size:0.83rem">Neočekivana greška</em>';
      });
  }

  function _addEmergencyRow() {
    if (!emergencyListEl) return;
    var idx = emergencyListEl.querySelectorAll('.emergency-row').length;
    var row = document.createElement('div');
    row.className = 'emergency-row';
    row.dataset.id = '';
    row.dataset.itemKey = '';
    row.style.cssText =
      'background:rgba(255,255,255,0.06);border-radius:8px;padding:0.65rem;' +
      'display:flex;flex-direction:column;gap:0.35rem;';
    row.innerHTML =
      '<div style="display:flex;gap:0.5rem;align-items:center">' +
        '<span style="font-size:0.72rem;opacity:0.45;min-width:1.4rem">#' + (idx + 1) + '</span>' +
        '<input data-field="name" style="flex:1" type="text" placeholder="Naziv servisa" value=""/>' +
        '<button data-action="delete" style="background:none;border:1px solid rgba(255,80,80,0.35);' +
          'color:#f87171;border-radius:5px;padding:0.15rem 0.45rem;cursor:pointer;font-size:0.78rem">✕</button>' +
      '</div>' +
      '<input data-field="phone"      type="text" placeholder="Telefon (+386 ...)"          value=""/>' +
      '<input data-field="address"    type="text" placeholder="Adresa (opciono)"             value=""/>' +
      '<input data-field="tel"        type="text" placeholder="tel: link — npr. tel:+38656…" value=""/>' +
      '<input data-field="directions" type="text" placeholder="Google Maps link"             value=""/>' +
      _buildMunHtml(['bovec']);
    emergencyListEl.appendChild(row);
    _preCheckMun(row);
    row.querySelector('[data-field=name]').focus();
  }

  function _deleteEmergencyRow(rowEl) {
    var id = rowEl.dataset.id;
    if (id) {
      sb.from('items').delete().eq('id', id).then(function (r) {
        if (r.error) {
          setStatus(emergencySaveStatus, 'Greška pri brisanju: ' + r.error.message, 'error');
          return;
        }
        loadEmergencyItems();
      });
    } else {
      rowEl.remove();
    }
  }

  function saveEmergencyItems() {
    if (!emergencyListEl) return;
    var rows   = emergencyListEl.querySelectorAll('.emergency-row');
    var parsed = [];
    rows.forEach(function (row, idx) {
      parsed.push({
        id:      row.dataset.id || null,
        itemKey: row.dataset.itemKey || '',
        order:   idx + 1,
        municipalitySlugs: _getMunSlugs(row),
        dataJson: {
          name:       row.querySelector('[data-field=name]').value.trim(),
          phone:      row.querySelector('[data-field=phone]').value.trim(),
          address:    row.querySelector('[data-field=address]').value.trim(),
          tel:        row.querySelector('[data-field=tel]').value.trim(),
          directions: row.querySelector('[data-field=directions]').value.trim()
        }
      });
    });
    if (!parsed.length) return;

    if (btnEmergencySave) btnEmergencySave.disabled = true;
    setStatus(emergencySaveStatus, 'Snimam…', 'info');

    ensureSectionExists('emergency').then(function () {
      var now = new Date().toISOString();
      var promises = parsed.map(function (p) {
        if (p.id) {
          return sb.from('items')
            .update({ data_json: p.dataJson, 'order': p.order, municipality_slugs: p.municipalitySlugs, updated_at: now })
            .eq('id', p.id);
        }
        var newKey = 'service-' + Date.now() + '-' +
                     Math.random().toString(36).slice(2, 7);
        return sb.from('items').insert({
          tenant_id: null, section_key: 'emergency', item_key: newKey,
          type: 'emergency_service', 'order': p.order, visible: true,
          municipality_slugs: p.municipalitySlugs,
          data_json: p.dataJson, updated_at: now
        });
      });
      return Promise.all(promises);
    }).then(function (results) {
      if (btnEmergencySave) btnEmergencySave.disabled = false;
      var errs = results
        .filter(function (r) { return r && r.error; })
        .map(function (r) { return r.error.message; });
      if (errs.length) {
        setStatus(emergencySaveStatus, 'Greška: ' + errs.join('; '), 'error');
        return;
      }
      setStatus(emergencySaveStatus, 'Sačuvano! ✓', 'info');
      loadEmergencyItems();
    }).catch(function (err) {
      if (btnEmergencySave) btnEmergencySave.disabled = false;
      setStatus(emergencySaveStatus, 'Greška: ' + (err && err.message ? err.message : err), 'error');
    });
  }

  // Delegate click events on the list (delete button + future drag handles)
  if (emergencyListEl) {
    emergencyListEl.addEventListener('click', function (e) {
      if (e.target.dataset.action === 'delete') {
        var row = e.target.closest('.emergency-row');
        if (row) _deleteEmergencyRow(row);
      }
    });
  }
  if (btnEmergencyAdd)  btnEmergencyAdd.addEventListener('click', _addEmergencyRow);
  if (btnEmergencySave) btnEmergencySave.addEventListener('click', saveEmergencyItems);

  // ── MASTER: Tenant editor state ───────────────────────────────────────────────
  var _masterTenantId   = null;
  var _masterConfigCache = {};

  // ── MASTER: Load tenant data via dropdown (delegates to openMasterEditor) ──────
  function loadMasterTenantData() {
    var tenantId = masterTenantSelect.value;
    if (!tenantId) { setStatus(masterSaveStatus, 'Izaberi tenant.', 'error'); return; }
    var meta = { external_id: '', name: tenantId, slug: '', ownerEmail: '—', status: '—' };
    _allTenants.forEach(function (t) { if (t.tenant_id === tenantId) meta = t; });
    openMasterEditor(tenantId, meta);
  }

  // ── MASTER: Save tenant data ──────────────────────────────────────────────────
  function saveMasterTenantData() {
    if (!_masterTenantId) { setStatus(masterSaveStatus, 'Nije učitan tenant — klikni "Učitaj podatke" najpre.', 'error'); return; }

    var phone    = masterCallPhoneInput.value.trim();
    var dirLink  = masterDirectionsLinkInput.value.trim();
    var rulesUrl = masterRulesUrlInput.value.trim();
    var parkMaps = masterParkingMapsInput.value.trim();
    var rebookEmail = masterRebookEmailInput.value.trim();

    if (!isValidLink(dirLink))  { setStatus(masterSaveStatus, 'Link za navigaciju nije validan (http/https/./).', 'error'); return; }
    if (!isValidLink(rulesUrl)) { setStatus(masterSaveStatus, 'Link za hišni red nije validan (http/https/./).', 'error'); return; }
    if (!isValidLink(parkMaps)) { setStatus(masterSaveStatus, 'Maps link za parking nije validan (http/https/./).', 'error'); return; }
    if (rebookEmail && rebookEmail.indexOf('@') < 0) { setStatus(masterSaveStatus, 'Rebook e-mail nije validan.', 'error'); return; }

    btnMasterSave.disabled = true;
    setStatus(masterSaveStatus, 'Snimam…', 'info');

    // Merge quick keys into cached config so other config keys are preserved
    var configData = Object.assign({}, _masterConfigCache);
    configData.quick_call_phone      = phone;
    configData.quick_directions_link = dirLink;
    configData.quick_rules_url       = rulesUrl || './pravila/index.html';

    Promise.all([
      upsertItem(_masterTenantId, 'info',        'default_config',      'config',  0, true, configData),
      upsertItem(_masterTenantId, 'house_rules', 'house_rules_private', 'rules',   0, true, { text: masterRulesTextArea.value }),
      upsertItem(_masterTenantId, 'parking',     'parking_recommended', 'parking', 0, true, {
        title: masterParkingTitleInput.value.trim(), address: masterParkingAddressInput.value.trim(),
        mapsLink: parkMaps, notes: masterParkingNotesArea.value.trim()
      }),
      upsertItem(_masterTenantId, 'booking',     'rebook',              'config',  0, true, {
        apartment_name: masterRebookNameInput.value.trim(), owner_phone: masterRebookPhoneInput.value.trim(),
        owner_email: rebookEmail, rebook_link: masterRebookLinkInput.value.trim(),
        instructions: masterRebookInstructionsArea.value.trim()
      }),
      upsertItem(_masterTenantId, 'maintenance', 'maintenance_config',  'config',  0, true, {
        visible: masterMaintVisibleChk ? masterMaintVisibleChk.checked : true,
        email:   masterMaintEmailInput ? masterMaintEmailInput.value.trim() : ''
      })
    ]).then(function (results) {
      btnMasterSave.disabled = false;
      var errors = results.filter(function (r) { return r && r.error; }).map(function (r) { return r.error.message; });
      if (errors.length) { setStatus(masterSaveStatus, 'Greška: ' + errors.join('; '), 'error'); return; }
      _masterConfigCache = configData;
      setStatus(masterSaveStatus, 'Sačuvano! ✓', 'info');
    }).catch(function (err) {
      btnMasterSave.disabled = false;
      setStatus(masterSaveStatus, 'Neočekivana greška: ' + (err && err.message), 'error');
    });
  }

  // ── OWNER: load editable data ─────────────────────────────────────────────────
  function loadOwnerEditableData(tenantId) {
    _ownerTenantId = tenantId;
    setStatus(ownerSaveStatus, 'Učitavam podatke…', 'info');

    sb.from('items')
      .select('section_key, item_key, data_json')
      .eq('tenant_id', tenantId)
      .in('item_key', ['default_config', 'house_rules_private', 'parking_recommended', 'rebook'])
      .then(function (result) {
        if (result.error) {
          setStatus(ownerSaveStatus, 'Greška pri učitavanju: ' + result.error.message, 'error');
          return;
        }

        var byKey = {};
        (result.data || []).forEach(function (r) { byKey[r.item_key] = r.data_json || {}; });

        // default_config — keep full object in cache so merge never wipes other keys
        var cfg = byKey['default_config'] || {};
        _ownerData.defaultConfig = cfg;
        ownerCallPhoneInput.value      = cfg.quick_call_phone      || cfg.host_phone  || '';
        ownerDirectionsLinkInput.value = cfg.quick_directions_link || cfg.maps_link   || '';
        ownerRulesUrlInput.value       = cfg.quick_rules_url       || './pravila/index.html';

        // house_rules_private
        var rules = byKey['house_rules_private'] || {};
        _ownerData.houseRulesPrivate = rules;
        ownerRulesTextArea.value = rules.text || '';

        // parking_recommended
        var park = byKey['parking_recommended'] || {};
        _ownerData.parkingRecommended = park;
        ownerParkingTitleInput.value   = park.title    || '';
        ownerParkingAddressInput.value = park.address  || '';
        ownerParkingMapsInput.value    = park.mapsLink || '';
        ownerParkingNotesArea.value    = park.notes    || '';

        // rebook
        var rebook = byKey['rebook'] || {};
        _ownerData.rebook = rebook;
        ownerRebookNameInput.value        = rebook.apartment_name || '';
        ownerRebookPhoneInput.value       = rebook.owner_phone    || '';
        ownerRebookEmailInput.value       = rebook.owner_email    || '';
        ownerRebookLinkInput.value        = rebook.rebook_link    || '';
        ownerRebookInstructionsArea.value = rebook.instructions   || '';

        // maintenance_config
        var maint = byKey['maintenance_config'] || {};
        _ownerData.maintConfig = maint;
        if (ownerMaintVisibleChk) ownerMaintVisibleChk.checked = maint.visible !== false;
        if (ownerMaintEmailInput) ownerMaintEmailInput.value = maint.email  || '';
        if (ownerMaintW3fInput)   ownerMaintW3fInput.value   = maint.w3f_key || '';

        clearStatus(ownerSaveStatus);
      });
  }

  // ── OWNER: save ───────────────────────────────────────────────────────────────
  function saveOwnerData() {
    var phone    = ownerCallPhoneInput.value.trim();
    var dirLink  = ownerDirectionsLinkInput.value.trim();
    var rulesUrl = ownerRulesUrlInput.value.trim();
    var rulesText     = ownerRulesTextArea.value;
    var parkTitle     = ownerParkingTitleInput.value.trim();
    var parkAddr      = ownerParkingAddressInput.value.trim();
    var parkMaps      = ownerParkingMapsInput.value.trim();
    var parkNotes     = ownerParkingNotesArea.value.trim();
    var rebookName    = ownerRebookNameInput.value.trim();
    var rebookPhone   = ownerRebookPhoneInput.value.trim();
    var rebookEmail   = ownerRebookEmailInput.value.trim();
    var rebookLink    = ownerRebookLinkInput.value.trim();
    var rebookInstr   = ownerRebookInstructionsArea.value.trim();
    var maintVisible  = ownerMaintVisibleChk ? ownerMaintVisibleChk.checked : true;
    var maintEmail    = ownerMaintEmailInput  ? ownerMaintEmailInput.value.trim()  : '';
    var maintW3f      = ownerMaintW3fInput    ? ownerMaintW3fInput.value.trim()    : '';

    if (!phone) {
      setStatus(ownerSaveStatus, 'Telefon ne može biti prazan.', 'error');
      return;
    }
    if (!isValidLink(dirLink)) {
      setStatus(ownerSaveStatus, 'Link za navigaciju nije validan (http://, https:// ili ./).', 'error');
      return;
    }
    if (!isValidLink(rulesUrl)) {
      setStatus(ownerSaveStatus, 'Link za hišni red nije validan (http://, https:// ili ./).', 'error');
      return;
    }
    if (!isValidLink(parkMaps)) {
      setStatus(ownerSaveStatus, 'Maps link za parking nije validan (http://, https:// ili ./).', 'error');
      return;
    }
    if (!_ownerTenantId) {
      setStatus(ownerSaveStatus, 'Greška: tenant_id nedostaje. Pokušaj ponovo da se prijaviš.', 'error');
      return;
    }
    if (rebookEmail && rebookEmail.indexOf('@') < 0) {
      setStatus(ownerSaveStatus, 'E-mail za rezervaciju nije validan.', 'error');
      return;
    }
    if (!isValidLink(rebookLink)) {
      setStatus(ownerSaveStatus, 'Rebook link nije validan (http://, https:// ili ./).', 'error');
      return;
    }

    // Client-side permission guard: OWNER may only write the 4 allowed keys
    var saveTargets = [
      { section: 'info',        item: 'default_config' },
      { section: 'house_rules', item: 'house_rules_private' },
      { section: 'parking',     item: 'parking_recommended' },
      { section: 'booking',     item: 'rebook' }
    ];
    for (var _gi = 0; _gi < saveTargets.length; _gi++) {
      if (!ownerMayWrite(saveTargets[_gi].section, saveTargets[_gi].item)) {
        setStatus(ownerSaveStatus, 'Nema dozvole za sekciju: ' + saveTargets[_gi].section + '/' + saveTargets[_gi].item, 'error');
        return;
      }
    }

    btnOwnerSave.disabled = true;
    setStatus(ownerSaveStatus, 'Snimam…', 'info');

    // Merge only the 3 quick keys into the full cached config object (other keys untouched)
    var configData = Object.assign({}, _ownerData.defaultConfig || {});
    configData.quick_call_phone      = phone;
    configData.quick_directions_link = dirLink;
    configData.quick_rules_url       = rulesUrl || './pravila/index.html';

    var houseRulesData = { text: rulesText };
    var parkingData    = { title: parkTitle, address: parkAddr, mapsLink: parkMaps, notes: parkNotes };
    var rebookData     = { apartment_name: rebookName, owner_phone: rebookPhone, owner_email: rebookEmail, rebook_link: rebookLink, instructions: rebookInstr };
    var maintData      = { visible: maintVisible, email: maintEmail };

    Promise.all([
      upsertItem(_ownerTenantId, 'info',        'default_config',       'config',  0, true, configData),
      upsertItem(_ownerTenantId, 'house_rules',  'house_rules_private',  'rules',   0, true, houseRulesData),
      upsertItem(_ownerTenantId, 'parking',      'parking_recommended',  'parking', 0, true, parkingData),
      upsertItem(_ownerTenantId, 'booking',      'rebook',               'config',  0, true, rebookData),
      upsertItem(_ownerTenantId, 'maintenance',  'maintenance_config',   'config',  0, true, maintData)
    ]).then(function (results) {
      btnOwnerSave.disabled = false;
      var errors = results
        .filter(function (r) { return r && r.error; })
        .map(function (r) { return r.error.message; });

      if (errors.length) {
        setStatus(ownerSaveStatus, 'Greška: ' + errors.join('; '), 'error');
        return;
      }
      // Update local cache so re-save merges correctly without refetch
      _ownerData.defaultConfig      = configData;
      _ownerData.houseRulesPrivate  = houseRulesData;
      _ownerData.parkingRecommended = parkingData;
      _ownerData.rebook             = rebookData;
      _ownerData.maintConfig        = maintData;
      setStatus(ownerSaveStatus, 'Sačuvano! ✓', 'info');
    }).catch(function (err) {
      btnOwnerSave.disabled = false;
      setStatus(ownerSaveStatus, 'Neočekivana greška: ' + (err && err.message), 'error');
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function showView(name) {
    viewLogin.classList.toggle('hidden', name !== 'login');
    viewDashboard.classList.toggle('hidden', name !== 'dashboard');
  }

  function showLoginError(msg) {
    loginError.textContent = msg;
    loginError.className = 'msg error';
  }

  function showDashStatus(msg, type) {
    dashStatus.textContent = msg;
    dashStatus.className = 'msg ' + (type || 'info');
  }

  function hideDashStatus() {
    dashStatus.className = 'msg hidden';
  }

  // ── Fetch role from user_profiles ────────────────────────────────────────────
  function loadProfile(userId) {
    showDashStatus('Učitavam profil…', 'info');

    // Hide role-specific panels until role is known
    masterPanel.classList.add('hidden');
    ownerPanel.classList.add('hidden');

    sb.from('user_profiles')
      .select('role, tenant_id, disabled')
      .eq('user_id', userId)
      .maybeSingle()
      .then(function (result) {
        var data  = result.data;
        var error = result.error;

        if (error) {
          showDashStatus('Greška pri čitanju profila: ' + error.message, 'warning');
          dashRole.textContent   = '—';
          dashTenant.textContent = '—';
          return;
        }

        if (!data) {
          showDashStatus('Nema profila — kontaktiraj admina.', 'warning');
          dashRole.textContent   = 'nema';
          dashTenant.textContent = 'n/a';
          return;
        }

        _currentRole = data.role || null;
        dashRole.textContent   = data.role   || '—';
        dashTenant.textContent = data.tenant_id || 'null';
        hideDashStatus();

        if (data.role === 'MASTER') {
          masterPanel.classList.remove('hidden');
          loadTenants();
          loadGlobalData();
          loadAnalytics();
          loadMunicipalities();
          loadEmergencyItems();
          loadPartners();
          loadDailyEssentials();
          loadMaintenanceReports();
          loadLostFound();
          loadSuggestions();
          loadGlobalSettings();
        } else if (data.role === 'OWNER') {
          if (data.disabled) {
            showDashStatus(
              'Dostop je onemogočen. Kontaktirajte administratorja.', 'warning');
            dashRole.textContent = 'OWNER (onemogočen)';
          } else {
            ownerPanel.classList.remove('hidden');
            loadOwnerEditableData(data.tenant_id);
          }
        }
      });
  }

  // ── Show dashboard for a logged-in user ──────────────────────────────────────
  function enterDashboard(user) {
    dashEmail.textContent = user.email || user.id;
    dashRole.textContent   = '…';
    dashTenant.textContent = '…';
    showView('dashboard');
    loadProfile(user.id);
  }

  // ── Login ────────────────────────────────────────────────────────────────────
  btnLogin.addEventListener('click', function () {
    var email    = inputEmail.value.trim();
    var password = inputPassword.value;

    if (!email || !password) {
      showLoginError('Unesite e-mail i lozinku.');
      return;
    }

    btnLogin.disabled   = true;
    btnLogin.textContent = 'Prijavljujem…';
    loginError.className = 'msg hidden';

    sb.auth.signInWithPassword({ email: email, password: password })
      .then(function (result) {
        btnLogin.disabled   = false;
        btnLogin.textContent = 'Prijava';

        if (result.error) {
          showLoginError(result.error.message);
          return;
        }

        enterDashboard(result.data.user);
      });
  });

  // Allow Enter key in password field to trigger login
  inputPassword.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') btnLogin.click();
  });

  // ── Master panel events ───────────────────────────────────────────────────────
  btnRefreshTenants.addEventListener('click', loadTenants);

  // Table search + status filter
  tenantsSearch.addEventListener('input', renderTenantsTable);
  tenantsFilterStatus.addEventListener('change', renderTenantsTable);

  // Delegated click handler for all table action buttons
  tenantsTbody.addEventListener('click', function (e) {
    var btn = e.target;
    if (!btn || !btn.classList) return;

    // ── Copy guest link ──
    if (btn.classList.contains('btn-copy-link')) {
      var url = btn.getAttribute('data-url');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () {
          var orig = btn.textContent;
          btn.textContent = 'Kopirano!';
          setTimeout(function () { btn.textContent = orig; }, 2000);
        }).catch(function () { btn.textContent = 'Greška'; });
      } else {
        // Fallback for non-HTTPS contexts
        var ta = document.createElement('textarea');
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); btn.textContent = 'Kopirano!'; } catch (ex) { btn.textContent = 'Greška'; }
        document.body.removeChild(ta);
        setTimeout(function () { btn.textContent = 'Kopiraj'; }, 2000);
      }
      return;
    }

    // ── Edit tenant ──
    if (btn.classList.contains('btn-edit-tenant')) {
      openMasterEditor(btn.getAttribute('data-tid'), {
        external_id: btn.getAttribute('data-ext'),
        name:        btn.getAttribute('data-name'),
        slug:        btn.getAttribute('data-slug'),
        ownerEmail:  btn.getAttribute('data-owner'),
        status:      btn.getAttribute('data-status')
      });
      return;
    }

    // ── Toggle active/inactive ──
    if (btn.classList.contains('btn-toggle-status')) {
      toggleTenantStatus(
        btn.getAttribute('data-tid'),
        btn.getAttribute('data-new-status'),
        btn
      );
      return;
    }

    // ── Send magic login link ──
    if (btn.classList.contains('btn-magic-link')) {
      sendMagicLink(
        btn.getAttribute('data-tid'),
        btn.getAttribute('data-slug'),
        btn.getAttribute('data-email'),
        btn
      );
      return;
    }

    // ── Detach (remove) owner ──
    if (btn.classList.contains('btn-detach-owner')) {
      detachOwner(btn.getAttribute('data-tid'), btn);
      return;
    }

    // ── Delete tenant + all data ──
    if (btn.classList.contains('btn-delete-tenant')) {
      deleteTenant(
        btn.getAttribute('data-tid'),
        btn.getAttribute('data-name'),
        btn
      );
      return;
    }
  });

  tenantNameInput.addEventListener('input', function () {
    tenantSlugInput.value = slugify(tenantNameInput.value);
  });

  btnCreateTenant.addEventListener('click', function () { quickAddTenant(false); });
  if (btnQuickInvite) btnQuickInvite.addEventListener('click', function () { quickAddTenant(true); });

  btnLinkOwner.addEventListener('click', linkOwnerToTenant);

  // ── Master global + tenant editor events ─────────────────────────────────────
  btnGlobalSave.addEventListener('click', saveGlobalData);
  if (btnRefreshAnalytics) btnRefreshAnalytics.addEventListener('click', loadAnalytics);
  btnMasterLoad.addEventListener('click', loadMasterTenantData);
  btnMasterSave.addEventListener('click', saveMasterTenantData);

  // ── Master export events ──────────────────────────────────────────────────────
  var btnExportTenant = document.getElementById('btn-export-tenant');
  var btnExportAll    = document.getElementById('btn-export-all');
  if (btnExportTenant) btnExportTenant.addEventListener('click', exportTenantJson);
  if (btnExportAll)    btnExportAll.addEventListener('click', exportAllTenants);

  // ── Owner panel events ────────────────────────────────────────────────────────
  btnOwnerSave.addEventListener('click', saveOwnerData);

  // ── Logout ───────────────────────────────────────────────────────────────────
  btnLogout.addEventListener('click', function () {
    btnLogout.disabled   = true;
    btnLogout.textContent = 'Odjavujem…';

    sb.auth.signOut().then(function () {
      btnLogout.disabled   = false;
      btnLogout.textContent = 'Odjava';
      inputEmail.value    = '';
      inputPassword.value = '';
      loginError.className = 'msg hidden';
      masterPanel.classList.add('hidden');
      ownerPanel.classList.add('hidden');
      _currentRole   = null;
      tenantsTbody.innerHTML = '<tr><td colspan="6" class="table-empty">—</td></tr>';
      // Reset owner form + state
      _ownerTenantId = null;
      _ownerData     = {};
      ownerCallPhoneInput.value      = '';
      ownerDirectionsLinkInput.value = '';
      ownerRulesUrlInput.value       = '';
      ownerRulesTextArea.value       = '';
      ownerParkingTitleInput.value   = '';
      ownerParkingAddressInput.value = '';
      ownerParkingMapsInput.value    = '';
      ownerParkingNotesArea.value    = '';
      ownerRebookNameInput.value        = '';
      ownerRebookPhoneInput.value       = '';
      ownerRebookEmailInput.value       = '';
      ownerRebookLinkInput.value        = '';
      ownerRebookInstructionsArea.value = '';
      clearStatus(ownerSaveStatus);
      // Reset master editor state
      _masterTenantId    = null;
      _masterConfigCache = {};
      masterTenantFields.classList.add('hidden');
      if (homeCardsEditor) homeCardsEditor.innerHTML = '';
      masterTenantSelect.value             = '';
      masterCallPhoneInput.value           = '';
      masterDirectionsLinkInput.value      = '';
      masterRulesUrlInput.value            = '';
      masterRulesTextArea.value            = '';
      masterParkingTitleInput.value        = '';
      masterParkingAddressInput.value      = '';
      masterParkingMapsInput.value         = '';
      masterParkingNotesArea.value         = '';
      masterRebookNameInput.value          = '';
      masterRebookPhoneInput.value         = '';
      masterRebookEmailInput.value         = '';
      masterRebookLinkInput.value          = '';
      masterRebookInstructionsArea.value   = '';
      clearStatus(globalSaveStatus);
      clearStatus(masterSaveStatus);
      showView('login');
    });
  });

  // ── Boot: check existing session ─────────────────────────────────────────────
  sb.auth.getSession().then(function (result) {
    var session = result.data && result.data.session;
    if (session && session.user) {
      enterDashboard(session.user);
    } else {
      showView('login');
    }
  });

})();
