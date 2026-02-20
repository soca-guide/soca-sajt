(function () {
  'use strict';

  // ── Supabase client (initialised by assets/supabase-client.js) ───────────────
  var sb = window.supabaseClient || null;

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
  var ownerRebookInstructionsArea = document.getElementById('owner-rebook-instructions');

  // Master editor refs (Global + Tenant)
  var globalHomeCardsArea          = document.getElementById('global-home-cards');
  var globalSaveStatus             = document.getElementById('global-save-status');
  var btnGlobalSave                = document.getElementById('btn-global-save');
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
                '>Login link</button>'
            : '') +
        '</td>' +
        '</tr>';
    }).join('');
  }

  // ── MASTER: Toggle tenant status ──────────────────────────────────────────────
  function toggleTenantStatus(tenantId, newStatus, btn) {
    btn.disabled = true;
    sb.from('tenants')
      .update({ status: newStatus })
      .eq('tenant_id', tenantId)
      .then(function (r) {
        btn.disabled = false;
        if (r.error) {
          setStatus(tenantsStatus, 'Greška pri promeni statusa: ' + r.error.message, 'error');
          return;
        }
        // Mirror disabled flag on owner profile (fire-and-forget)
        sb.from('user_profiles')
          .update({ disabled: newStatus !== 'active' })
          .eq('tenant_id', tenantId)
          .eq('role', 'OWNER')
          .then(function () {});
        // Update local cache and re-render (no full reload needed)
        _allTenants.forEach(function (t) {
          if (t.tenant_id === tenantId) t.status = newStatus;
        });
        renderTenantsTable();
      });
  }

  // ── MASTER: Send magic login link to owner ────────────────────────────────────
  function sendMagicLink(tenantId, tenantSlug, ownerEmail, btn) {
    btn.disabled    = true;
    btn.textContent = 'Šaljem…';
    sb.functions.invoke('owner-magic-link', {
      body: { owner_email: ownerEmail, tenant_id: tenantId, tenant_slug: tenantSlug }
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

        // Call Edge Function to invite owner
        setStatus(createTenantStatus, 'Šaljem pozivnicu ' + email + '…', 'info');
        sb.functions.invoke('invite-owner', {
          body: { owner_email: email, tenant_id: newId, tenant_slug: slug }
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
              : 'Korisnik već postoji — profil i dozvole su ažurirani.';
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
    var userId   = ownerUserIdInput.value.trim();
    var tenantId = ownerTenantSelect.value;

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

    // Step 1: upsert user_profiles
    sb.from('user_profiles')
      .upsert({ user_id: userId, role: 'OWNER', tenant_id: tenantId }, { onConflict: 'user_id' })
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

  function upsertItem(tenantId, sectionKey, itemKey, type, orderVal, visible, dataObj) {
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
  }

  // ── MASTER: Global item upsert (tenant_id IS NULL) ───────────────────────────
  // Cannot use onConflict='tenant_id,...' for NULLs (NULL != NULL in SQL unique),
  // so we do a select-then-update-or-insert approach.
  function upsertGlobalItem(sectionKey, itemKey, dataObj) {
    var now = new Date().toISOString();
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
  }

  // ── MASTER: Load global home_cards config ────────────────────────────────────
  function loadGlobalData() {
    sb.from('items')
      .select('data_json')
      .eq('section_key', 'ui')
      .eq('item_key', 'home_cards')
      .is('tenant_id', null)
      .maybeSingle()
      .then(function (r) {
        if (r.error || !r.data) return;
        try { globalHomeCardsArea.value = JSON.stringify(r.data.data_json, null, 2); } catch (e) {}
      });
  }

  // ── MASTER: Save global home_cards config ────────────────────────────────────
  function saveGlobalData() {
    var raw = globalHomeCardsArea.value.trim();
    var parsed;
    try { parsed = JSON.parse(raw); } catch (e) {
      setStatus(globalSaveStatus, 'Nije validan JSON.', 'error');
      return;
    }
    btnGlobalSave.disabled = true;
    setStatus(globalSaveStatus, 'Snimam…', 'info');
    upsertGlobalItem('ui', 'home_cards', parsed)
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

    Promise.all([
      upsertItem(_ownerTenantId, 'info',        'default_config',       'config',  0, true, configData),
      upsertItem(_ownerTenantId, 'house_rules',  'house_rules_private',  'rules',   0, true, houseRulesData),
      upsertItem(_ownerTenantId, 'parking',      'parking_recommended',  'parking', 0, true, parkingData),
      upsertItem(_ownerTenantId, 'booking',      'rebook',               'config',  0, true, rebookData)
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
        } else if (data.role === 'OWNER') {
          if (data.disabled) {
            showDashStatus(
              'Pristup deaktiviran. Kontaktirajte administratora.', 'warning');
            dashRole.textContent = 'OWNER (deaktiviran)';
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
  });

  tenantNameInput.addEventListener('input', function () {
    tenantSlugInput.value = slugify(tenantNameInput.value);
  });

  btnCreateTenant.addEventListener('click', function () { quickAddTenant(false); });
  if (btnQuickInvite) btnQuickInvite.addEventListener('click', function () { quickAddTenant(true); });

  btnLinkOwner.addEventListener('click', linkOwnerToTenant);

  // ── Master global + tenant editor events ─────────────────────────────────────
  btnGlobalSave.addEventListener('click', saveGlobalData);
  btnMasterLoad.addEventListener('click', loadMasterTenantData);
  btnMasterSave.addEventListener('click', saveMasterTenantData);

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
      tenantsTbody.innerHTML = '<tr><td colspan="4" class="table-empty">—</td></tr>';
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
      globalHomeCardsArea.value            = '';
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
