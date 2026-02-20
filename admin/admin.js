(function () {
  'use strict';

  // ── Supabase config ──────────────────────────────────────────────────────────
  var SUPABASE_URL = 'https://hkztanenhxoducivluor.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_VJewQ-VKXAyCQyK_FtVPow_HOP0_UiT';

  // The CDN UMD build exposes window.supabase = { createClient, ... }
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    alert('Supabase CDN nije učitan. Provjeri internet vezu.');
    return;
  }

  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
      .select('tenant_id, slug, name, status')
      .order('created_at', { ascending: false })
      .then(function (result) {
        if (result.error) {
          setStatus(tenantsStatus, 'Greška: ' + result.error.message, 'error');
          return;
        }

        clearStatus(tenantsStatus);
        var rows = result.data || [];

        // Rebuild tenant select (preserve blank first option)
        ownerTenantSelect.innerHTML = '<option value="">— izaberi tenant —</option>';

        if (rows.length === 0) {
          tenantsTbody.innerHTML = '<tr><td colspan="4" class="table-empty">Nema tenanta.</td></tr>';
          return;
        }

        tenantsTbody.innerHTML = rows.map(function (t) {
          return '<tr>' +
            '<td class="mono">' + esc(t.tenant_id) + '</td>' +
            '<td>' + esc(t.slug) + '</td>' +
            '<td>' + esc(t.name) + '</td>' +
            '<td>' + esc(t.status || '') + '</td>' +
            '</tr>';
        }).join('');

        rows.forEach(function (t) {
          var opt = document.createElement('option');
          opt.value = t.tenant_id;
          opt.textContent = t.name + ' (' + t.slug + ')';
          ownerTenantSelect.appendChild(opt);
        });
      });
  }

  function esc(str) {
    return String(str || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── MASTER: Create tenant ─────────────────────────────────────────────────────
  function createTenant() {
    var name = tenantNameInput.value.trim();
    var slug = tenantSlugInput.value.trim();

    if (!name || !slug) {
      setStatus(createTenantStatus, 'Unesite naziv i slug.', 'error');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setStatus(createTenantStatus, 'Slug sme da sadrži samo mala slova, cifre i crtice.', 'error');
      return;
    }

    btnCreateTenant.disabled = true;
    setStatus(createTenantStatus, 'Kreiram tenant…', 'info');

    var newId = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0;
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });

    sb.from('tenants')
      .insert({ tenant_id: newId, name: name, slug: slug, status: 'active' })
      .then(function (result) {
        btnCreateTenant.disabled = false;

        if (result.error) {
          setStatus(createTenantStatus, 'Greška: ' + result.error.message, 'error');
          return;
        }

        setStatus(createTenantStatus, 'Tenant "' + name + '" kreiran!', 'info');
        tenantNameInput.value = '';
        tenantSlugInput.value = '';
        loadTenants();
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
          { tenant_id: tenantId, role: 'OWNER', section_key: 'house_rules', item_key: 'house_rules_private',  can_view: true, can_edit: true }
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

  // ── OWNER: load editable data ─────────────────────────────────────────────────
  function loadOwnerEditableData(tenantId) {
    _ownerTenantId = tenantId;
    setStatus(ownerSaveStatus, 'Učitavam podatke…', 'info');

    sb.from('items')
      .select('section_key, item_key, data_json')
      .eq('tenant_id', tenantId)
      .in('item_key', ['default_config', 'house_rules_private', 'parking_recommended'])
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

    btnOwnerSave.disabled = true;
    setStatus(ownerSaveStatus, 'Snimam…', 'info');

    // Merge only the 3 quick keys into the full cached config object (other keys untouched)
    var configData = Object.assign({}, _ownerData.defaultConfig || {});
    configData.quick_call_phone      = phone;
    configData.quick_directions_link = dirLink;
    configData.quick_rules_url       = rulesUrl || './pravila/index.html';

    var houseRulesData = { text: rulesText };
    var parkingData    = { title: parkTitle, address: parkAddr, mapsLink: parkMaps, notes: parkNotes };

    Promise.all([
      upsertItem(_ownerTenantId, 'info',        'default_config',       'config',  0, true, configData),
      upsertItem(_ownerTenantId, 'house_rules',  'house_rules_private',  'rules',   0, true, houseRulesData),
      upsertItem(_ownerTenantId, 'parking',      'parking_recommended',  'parking', 0, true, parkingData)
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
      .select('role, tenant_id')
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

        dashRole.textContent   = data.role   || '—';
        dashTenant.textContent = data.tenant_id || 'null';
        hideDashStatus();

        if (data.role === 'MASTER') {
          masterPanel.classList.remove('hidden');
          loadTenants();
        } else if (data.role === 'OWNER') {
          ownerPanel.classList.remove('hidden');
          loadOwnerEditableData(data.tenant_id);
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

  tenantNameInput.addEventListener('input', function () {
    tenantSlugInput.value = slugify(tenantNameInput.value);
  });

  btnCreateTenant.addEventListener('click', createTenant);

  btnLinkOwner.addEventListener('click', linkOwnerToTenant);

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
      clearStatus(ownerSaveStatus);
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
