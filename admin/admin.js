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
  var ownerPlaceholder     = document.getElementById('owner-placeholder');
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
    ownerPlaceholder.classList.add('hidden');

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
          ownerPlaceholder.classList.remove('hidden');
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
      ownerPlaceholder.classList.add('hidden');
      tenantsTbody.innerHTML = '<tr><td colspan="4" class="table-empty">—</td></tr>';
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
