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
  var LANG_LIST = ['sl','en','de','pl','cs','it'];
  var PARK_LANGS = LANG_LIST;
  var ownerParkingTitleSlInput  = document.getElementById('owner-parking-title-sl');
  var ownerParkingTitleEnInput  = document.getElementById('owner-parking-title-en');
  var ownerParkingAddressInput  = document.getElementById('owner-parking-address');
  var ownerParkingMapsInput     = document.getElementById('owner-parking-maps');
  var ownerParkingHoursInput    = document.getElementById('owner-parking-hours');
  var ownerParkingPaidChk       = document.getElementById('owner-parking-paid');
  var ownerParkingNotesSlArea   = document.getElementById('owner-parking-notes-sl');
  var ownerParkingNotesEnArea   = document.getElementById('owner-parking-notes-en');
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
  var masterParkingTitleSlInput    = document.getElementById('master-parking-title-sl');
  var masterParkingTitleEnInput    = document.getElementById('master-parking-title-en');
  var masterParkingAddressInput    = document.getElementById('master-parking-address');
  var masterParkingMapsInput       = document.getElementById('master-parking-maps');
  var masterParkingHoursInput      = document.getElementById('master-parking-hours');
  var masterParkingPaidChk         = document.getElementById('master-parking-paid');
  var masterParkingNotesSlArea     = document.getElementById('master-parking-notes-sl');
  var masterParkingNotesEnArea     = document.getElementById('master-parking-notes-en');
  var masterRebookNameInput        = document.getElementById('master-rebook-name');
  var masterRebookPhoneInput       = document.getElementById('master-rebook-phone');
  var masterRebookEmailInput       = document.getElementById('master-rebook-email');
  var masterRebookLinkInput        = document.getElementById('master-rebook-link');
  var masterRebookInstructionsArea = document.getElementById('master-rebook-instructions');
  var masterMaintVisibleChk        = document.getElementById('master-maint-visible');
  var masterMaintEmailInput        = document.getElementById('master-maint-email');
  var masterMaintW3fInput          = document.getElementById('master-maint-w3f');
  var masterBiznisEnabled          = document.getElementById('master-biznis-enabled');
  var masterBiznisName             = document.getElementById('master-biznis-name');
  var masterBiznisType             = document.getElementById('master-biznis-type');
  var masterBiznisDesc             = document.getElementById('master-biznis-desc');
  var masterBiznisPhone            = document.getElementById('master-biznis-phone');
  var masterBiznisWebsite          = document.getElementById('master-biznis-website');
  var masterBiznisBooking          = document.getElementById('master-biznis-booking');
  var masterBiznisImage            = document.getElementById('master-biznis-image');
  var masterBiznisLogo             = document.getElementById('master-biznis-logo');
  var mbLogoFile                   = document.getElementById('mb-logo-file');
  var mbLogoFilename               = document.getElementById('mb-logo-filename');
  var mbLogoPreview                = document.getElementById('mb-logo-preview');
  var mbLogoPreviewWrap            = document.getElementById('mb-logo-preview-wrap');
  var btnMbLogoClear               = document.getElementById('btn-mb-logo-clear');
  var mbImageFile                  = document.getElementById('mb-image-file');
  var mbImageFilename              = document.getElementById('mb-image-filename');
  var mbImagePreview               = document.getElementById('mb-image-preview');
  var mbImagePreviewWrap           = document.getElementById('mb-image-preview-wrap');
  var btnMbImageClear              = document.getElementById('btn-mb-image-clear');
  var mbUploadStatus               = document.getElementById('mb-upload-status');
  var btnMasterSave                = document.getElementById('btn-master-save');
  var btnLoadSporocila             = document.getElementById('btn-load-sporocila');
  var sporocilaList                = document.getElementById('sporocila-list');

  // Quick-add refs
  var quickSocaIdInput    = document.getElementById('quick-soca-id');
  var quickOwnerEmailInput = document.getElementById('quick-owner-email');
  var quickLocationInput  = document.getElementById('quick-location');
  var btnQuickInvite      = document.getElementById('btn-quick-invite');

  // Owner welcome modal refs
  var ownerWelcomeModal = document.getElementById('owner-welcome-modal');
  var owmTitle          = document.getElementById('owm-title');
  var owmSubtitle       = document.getElementById('owm-subtitle');
  var owmGuestUrl       = document.getElementById('owm-guest-url');
  var owmAdminUrl       = document.getElementById('owm-admin-url');
  var owmCopyGuest      = document.getElementById('owm-copy-guest');
  var owmCopyAdmin      = document.getElementById('owm-copy-admin');
  var owmCopyAll        = document.getElementById('owm-copy-all');
  var owmClose          = document.getElementById('owner-welcome-close');

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

        // Paralelno: user_profiles (potvrdeni vlasnici) + pending_owner_invites (jos nisu kliknuli link)
        Promise.all([
          sb.from('user_profiles').select('tenant_id,email,user_email').in('tenant_id', tenantIds).eq('role', 'OWNER'),
          sb.from('pending_owner_invites').select('tenant_id,email').in('tenant_id', tenantIds)
        ]).then(function (results) {
            var emailMap    = {};  // tenant_id → { email, pending }
            try {
              // Potvrdeni vlasnici (user_profiles)
              (results[0].data || []).forEach(function (p) {
                if (p.tenant_id) emailMap[p.tenant_id] = { email: p.email || p.user_email || '—', pending: false };
              });
              // Cekanje (pending_owner_invites) — samo ako nema potvrdenog
              (results[1].data || []).forEach(function (p) {
                if (p.tenant_id && !emailMap[p.tenant_id]) {
                  emailMap[p.tenant_id] = { email: p.email, pending: true };
                }
              });
            } catch (e) {}

            _allTenants = rows.map(function (t) {
              var info = emailMap[t.tenant_id];
              return {
                tenant_id:    t.tenant_id,
                external_id:  t.external_id || '',
                name:         t.name,
                slug:         t.slug,
                status:       t.status || '',
                ownerEmail:   info ? info.email : '—',
                ownerPending: info ? info.pending : false
              };
            });
            renderTenantsTable();
          })
          .catch(function () {
            _allTenants = rows.map(function (t) {
              return {
                tenant_id:    t.tenant_id,
                external_id:  t.external_id || '',
                name:         t.name,
                slug:         t.slug,
                status:       t.status || '',
                ownerEmail:   '—',
                ownerPending: false
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

    tenantsTbody.innerHTML = filtered.map(function (t) {
      // Always use origin so the link works regardless of trailing-slash variations in /admin URL
      var guestUrl  = window.location.origin + '/index.html?t=' + encodeURIComponent(t.slug);
      var isActive  = t.status === 'active';
      var toggleLbl = isActive ? 'Isključi' : 'Aktiviraj';
      var toggleSt  = isActive ? 'inactive' : 'active';
      var statusClr = isActive ? '#4ade80' : '#f87171';

      return '<tr>' +
        '<td class="mono">'  + esc(t.external_id || '—') + '</td>' +
        '<td>'               + esc(t.name)                + '</td>' +
        '<td>'               + esc(t.slug)                + '</td>' +
        '<td style="color:' + statusClr + ';font-weight:600">' + esc(t.status) + '</td>' +
        '<td>' + (t.ownerPending
            ? '<span title="Pozivnica poslata, čeka potvrdu" style="color:#fbbf24">⏳ ' + esc(t.ownerEmail) + '</span>'
            : esc(t.ownerEmail)) + '</td>' +
        '<td style="white-space:nowrap;display:flex;gap:4px;flex-wrap:wrap">' +
          '<a href="' + esc(guestUrl) + '" target="_blank" rel="noopener" ' +
             'style="display:inline-block;padding:2px 8px;border-radius:4px;' +
                    'background:#1e3a2a;color:#4ade80;font-size:0.75rem;text-decoration:none">Otvori</a>' +
          '<a href="../admin/" target="_blank" rel="noopener" ' +
             'style="display:inline-block;padding:2px 8px;border-radius:4px;' +
                    'background:#1a2a3a;color:#93c5fd;font-size:0.75rem;text-decoration:none">Admin</a>' +
          '<a href="' + window.location.origin + '/admin/?view=owner&t=' + encodeURIComponent(t.slug) + '" target="_blank" rel="noopener" ' +
             'style="display:inline-block;padding:2px 8px;border-radius:4px;' +
                    'background:#2a1a3a;color:#c4b5fd;font-size:0.75rem;text-decoration:none">🔧 Owner</a>' +
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
                ' title="' + (t.ownerPending ? 'Pošalji ponovo (čeka klik na link)' : 'Pošalji novi login link') + '"' +
                '>' + (t.ownerPending ? '⏳ Pošalji ponovo' : 'Login link') + '</button>' +
              (!t.ownerPending
                ? '<button class="btn-sm btn-detach-owner"' +
                    ' data-tid="'  + esc(t.tenant_id)  + '"' +
                    ' style="color:#f87171"' +
                    '>Ukloni vlasnika</button>'
                : '')
            : '<button class="btn-sm btn-invite-owner"' +
                ' data-tid="'  + esc(t.tenant_id) + '"' +
                ' data-slug="' + esc(t.slug)      + '"' +
                ' data-name="' + esc(t.name)      + '"' +
                ' title="Poveži vlasnika sa ovim apartmanom"' +
                ' style="color:#fbbf24">+ Poveži vlasnika</button>') +
          '<button class="btn-sm btn-delete-tenant"' +
            ' data-tid="'  + esc(t.tenant_id) + '"' +
            ' data-name="' + esc(t.name)      + '"' +
            ' style="color:#f87171;font-weight:700"' +
            '>Obriši</button>' +
        '</td>' +
        '</tr>';
    }).join('');
  }

  // ── MASTER: Fallback — set_status direktno u DB ──────────────────────────────
  function _setStatusFallback(tenantId, newStatus, onSuccess, onError) {
    sb.from('tenants').update({ status: newStatus }).eq('tenant_id', tenantId)
      .then(function (r) {
        if (r.error) { onError(r.error.message); return; }
        // Mirror disabled na user_profiles (best-effort)
        sb.from('user_profiles')
          .update({ disabled: newStatus !== 'active' })
          .eq('tenant_id', tenantId).eq('role', 'OWNER')
          .then(function () { onSuccess(); })
          .catch(function () { onSuccess(); });
      })
      .catch(function (e) { onError(e && e.message ? e.message : String(e)); });
  }

  // ── MASTER: Toggle tenant status ──────────────────────────────────────────────
  function toggleTenantStatus(tenantId, newStatus, btn) {
    btn.disabled = true;

    function _done() {
      btn.disabled = false;
      _allTenants.forEach(function (t) {
        if (t.tenant_id === tenantId) t.status = newStatus;
      });
      renderTenantsTable();
    }
    function _fail(msg) {
      btn.disabled = false;
      setStatus(tenantsStatus, 'Greška pri promeni statusa: ' + msg, 'error');
    }

    sb.functions.invoke('master_admin', {
      body: { action: 'set_status', tenant_id: tenantId, status: newStatus }
    }).then(function (r) {
      if (!r.error) { _done(); return; }
      _setStatusFallback(tenantId, newStatus, _done, _fail);
    }).catch(function () {
      _setStatusFallback(tenantId, newStatus, _done, _fail);
    });
  }

  // ── MASTER: Owner welcome modal ───────────────────────────────────────────────
  function showOwnerWelcomeModal(tenantName, tenantSlug, ownerEmail, emailSent) {
    if (!ownerWelcomeModal) return;
    var base      = window.location.origin + window.location.pathname.replace(/\/admin\/[^/]*$/, '');
    var guestUrl  = base + '/index.html?t=' + encodeURIComponent(tenantSlug);
    var adminUrl  = window.location.origin + '/admin/';

    if (owmTitle)    owmTitle.textContent    = '🎉 Apartman "' + tenantName + '" kreiran!';
    if (owmSubtitle) owmSubtitle.textContent = emailSent
      ? '✅ Pozivnica poslata na ' + ownerEmail + '. Proslijedi i ove podatke vlasniku:'
      : '⚠️ Email nije poslan automatski. Proslijedi vlasniku (' + ownerEmail + ') ove podatke:';

    if (owmGuestUrl)  owmGuestUrl.textContent  = guestUrl;
    if (owmAdminUrl)  owmAdminUrl.textContent  = adminUrl;

    function _copy(text, btn) {
      var orig = btn.textContent;
      (navigator.clipboard
        ? navigator.clipboard.writeText(text)
        : Promise.reject()
      ).catch(function () {
        var ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta);
      }).finally(function () {
        btn.textContent = 'Kopirano! ✓';
        setTimeout(function () { btn.textContent = orig; }, 2000);
      });
    }

    if (owmCopyGuest) owmCopyGuest.onclick = function () { _copy(guestUrl, owmCopyGuest); };
    if (owmCopyAdmin) owmCopyAdmin.onclick = function () { _copy(adminUrl, owmCopyAdmin); };
    if (owmCopyAll) owmCopyAll.onclick = function () {
      var txt = 'Apartman: ' + tenantName + '\n\n' +
        '🔗 Link za goste (dijeli gostima):\n' + guestUrl + '\n\n' +
        '⚙️ Admin panel (upravljanje apartmanom):\n' + adminUrl + '\n\n' +
        '📋 Kako se prijaviti:\n' +
        '1. Otvori admin panel link\n' +
        '2. Unesi email → klikni "Pošalji magic link"\n' +
        '3. Provjeri inbox → klikni link za prijavu\n' +
        '4. Popuni podatke o apartmanu\n' +
        '5. Dijeli link za goste pri svakom check-in';
      _copy(txt, owmCopyAll);
    };

    ownerWelcomeModal.style.display = 'block';
  }

  if (owmClose) owmClose.onclick = function () {
    if (ownerWelcomeModal) ownerWelcomeModal.style.display = 'none';
  };
  if (ownerWelcomeModal) ownerWelcomeModal.addEventListener('click', function (e) {
    if (e.target === ownerWelcomeModal) ownerWelcomeModal.style.display = 'none';
  });

  // ── MASTER: Send welcome email via send-email Edge Function ───────────────────
  function sendOwnerWelcomeEmail(ownerEmail, tenantName, tenantSlug) {
    var origin   = window.location.origin;
    var guestUrl = origin + '/index.html?t=' + encodeURIComponent(tenantSlug);
    var adminUrl = origin + '/admin/?t=' + encodeURIComponent(tenantSlug);
    fetch('/api/send-welcome-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner_email:  ownerEmail,
        tenant_name:  tenantName,
        tenant_slug:  tenantSlug,
        guest_url:    guestUrl,
        admin_url:    adminUrl
      })
    }).catch(function () {}); // best-effort, greška ne blokira UI
  }

  // ── MASTER: Fallback invite (bez Edge Function) ──────────────────────────────
  // Samo upisuje pending_owner_invites — NE poziva signInWithOtp (inače Supabase šalje
  // vlastiti "Your Magic Link" email umjesto Revantora branded email-a).
  // DB trigger auto_link_pending_owner kreira owner profil pri prvoj prijavi vlasnika.
  function _inviteFallback(ownerEmail, tenantId, onSuccess, onError) {
    sb.from('pending_owner_invites')
      .upsert({ email: ownerEmail.toLowerCase(), tenant_id: tenantId },
               { onConflict: 'email' })
      .then(function (upsertRes) {
        if (upsertRes && upsertRes.error) {
          onError('pending_owner_invites: ' + upsertRes.error.message);
          return;
        }
        onSuccess();
      })
      .catch(function (err) { onError(err && err.message ? err.message : String(err)); });
  }

  // ── MASTER: Send magic login link to owner ────────────────────────────────────
  function sendMagicLink(tenantId, tenantSlug, ownerEmail, btn) {
    btn.disabled    = true;
    btn.textContent = 'Šaljem…';

    function _done(label) {
      btn.disabled    = false;
      btn.textContent = label;
      if (label !== 'Greška!') setTimeout(function () { btn.textContent = 'Login link'; }, 3000);
    }

    console.log('[Admin LoginLink] invoke start', {
      function_name: 'master_admin',
      action: 'invite_owner',
      tenant_id: tenantId,
      tenant_slug: tenantSlug,
      owner_email: ownerEmail
    });
    sb.functions.invoke('master_admin', {
      body: { action: 'invite_owner', owner_email: ownerEmail, tenant_id: tenantId, tenant_slug: tenantSlug }
    }).then(function (r) {
      if (!r.error) {
        console.log('[Admin LoginLink] invoke end', {
          function_name: 'master_admin',
          action: 'invite_owner',
          ok: true,
          response: r.data || null
        });
        _done('Poslato! ✓');
        return;
      }
      console.error('[Admin LoginLink] invoke error', {
        function_name: 'master_admin',
        action: 'invite_owner',
        response: r.data || null,
        error: r.error || null
      });
      // master_admin fallback: use send-owner-invite (Resend-only path)
      console.log('[Admin LoginLink] invoke start', {
        function_name: 'send-owner-invite',
        tenant_id: tenantId,
        tenant_slug: tenantSlug,
        owner_email: ownerEmail
      });
      return sb.functions.invoke('send-owner-invite', {
        body: {
          tenant_id: tenantId,
          tenant_slug: tenantSlug,
          tenant_name: tenantSlug || 'apartma',
          owner_email: ownerEmail,
          locale: 'sl'
          // NO admin_url / site_url — edge function reads ONLY from env secrets
        }
      }).then(function (r2) {
        console.log('[Admin LoginLink] invoke end', {
          function_name: 'send-owner-invite',
          ok: !r2.error && !!(r2.data && r2.data.ok),
          response: r2.data || null,
          error: r2.error || null
        });
        if (r2.error || !(r2.data && r2.data.ok)) {
          _done('Greška!');
          setStatus(tenantsStatus, 'Greška: ' + ((r2.data && r2.data.error) || r2.error || 'unknown'), 'error');
          return;
        }
        _done('Poslato ✓');
      }).catch(function (err2) {
        console.error('[Admin LoginLink] invoke error', {
          function_name: 'send-owner-invite',
          error_message: err2 && err2.message ? err2.message : null,
          error: err2 || null
        });
        _done('Greška!');
        setStatus(tenantsStatus, 'Greška: ' + (err2 && err2.message ? err2.message : 'network'), 'error');
      });
    }).catch(function (err) {
      console.error('[Admin LoginLink] invoke error', {
        function_name: 'master_admin',
        action: 'invite_owner',
        error_message: err && err.message ? err.message : null,
        error: err || null
      });
      _done('Greška!');
      setStatus(tenantsStatus, 'Greška: master_admin nedostupan.', 'error');
    });
  }

  // ── MASTER: Fallback — detach_owner direktno u DB ────────────────────────────
  function _detachOwnerFallback(tenantId, onSuccess, onError) {
    // permissions (best-effort)
    sb.from('permissions').delete().eq('tenant_id', tenantId).eq('role', 'OWNER')
      .then(function () {
        // pending_owner_invites (best-effort)
        sb.from('pending_owner_invites').delete().eq('tenant_id', tenantId)
          .then(function () {
            sb.from('user_profiles').delete().eq('tenant_id', tenantId).eq('role', 'OWNER')
              .then(function (r) {
                if (r.error) { onError(r.error.message); return; }
                onSuccess();
              })
              .catch(function (e) { onError(e && e.message ? e.message : String(e)); });
          })
          .catch(function () {
            sb.from('user_profiles').delete().eq('tenant_id', tenantId).eq('role', 'OWNER')
              .then(function (r) {
                if (r.error) { onError(r.error.message); return; }
                onSuccess();
              })
              .catch(function (e) { onError(e && e.message ? e.message : String(e)); });
          });
      })
      .catch(function () {
        sb.from('user_profiles').delete().eq('tenant_id', tenantId).eq('role', 'OWNER')
          .then(function (r) {
            if (r.error) { onError(r.error.message); return; }
            onSuccess();
          })
          .catch(function (e) { onError(e && e.message ? e.message : String(e)); });
      });
  }

  // ── MASTER: Detach (remove) owner from a tenant ──────────────────────────────
  function detachOwner(tenantId, btn) {
    if (!confirm('Ukloniti vlasnika iz ovog apartmana?\n(user_profiles i dozvole za ovaj tenant biće obrisani.)')) return;
    btn.disabled    = true;
    btn.textContent = 'Uklanijam…';

    function _done() {
      btn.disabled    = false;
      btn.textContent = 'Ukloni vlasnika';
      _allTenants.forEach(function (t) {
        if (t.tenant_id === tenantId) t.ownerEmail = '—';
      });
      renderTenantsTable();
    }
    function _fail(msg) {
      btn.disabled    = false;
      btn.textContent = 'Ukloni vlasnika';
      setStatus(tenantsStatus, 'Greška pri uklanjanju vlasnika: ' + msg, 'error');
    }

    sb.functions.invoke('master_admin', {
      body: { action: 'detach_owner', tenant_id: tenantId }
    }).then(function (r) {
      if (!r.error) { _done(); return; }
      _detachOwnerFallback(tenantId, _done, _fail);
    }).catch(function () {
      _detachOwnerFallback(tenantId, _done, _fail);
    });
  }

  // ── MASTER: Fallback — delete_tenant direktno u DB ───────────────────────────
  function _deleteTenantFallback(tenantId, onSuccess, onError) {
    // Kaskadni delete: items → permissions → pending_owner_invites → user_profiles → tenants
    sb.from('items').delete().eq('tenant_id', tenantId)
      .then(function (r1) {
        if (r1.error) { onError('Brisanje items: ' + r1.error.message); return; }
        sb.from('permissions').delete().eq('tenant_id', tenantId)
          .then(function () {
            sb.from('pending_owner_invites').delete().eq('tenant_id', tenantId)
              .then(function () {
                sb.from('user_profiles').delete().eq('tenant_id', tenantId)
                  .then(function (r2) {
                    if (r2.error) { onError('Brisanje user_profiles: ' + r2.error.message); return; }
                    sb.from('tenants').delete().eq('tenant_id', tenantId)
                      .then(function (r3) {
                        if (r3.error) { onError('Brisanje tenant: ' + r3.error.message); return; }
                        onSuccess();
                      })
                      .catch(function (e) { onError(e && e.message ? e.message : String(e)); });
                  })
                  .catch(function (e) { onError(e && e.message ? e.message : String(e)); });
              })
              .catch(function () {
                sb.from('user_profiles').delete().eq('tenant_id', tenantId)
                  .then(function (r2) {
                    if (r2.error) { onError('Brisanje user_profiles: ' + r2.error.message); return; }
                    sb.from('tenants').delete().eq('tenant_id', tenantId)
                      .then(function (r3) {
                        if (r3.error) { onError('Brisanje tenant: ' + r3.error.message); return; }
                        onSuccess();
                      })
                      .catch(function (e) { onError(e && e.message ? e.message : String(e)); });
                  })
                  .catch(function (e) { onError(e && e.message ? e.message : String(e)); });
              });
          })
          .catch(function () {
            sb.from('tenants').delete().eq('tenant_id', tenantId)
              .then(function (r3) {
                if (r3.error) { onError('Brisanje tenant: ' + r3.error.message); return; }
                onSuccess();
              })
              .catch(function (e) { onError(e && e.message ? e.message : String(e)); });
          });
      })
      .catch(function (e) { onError(e && e.message ? e.message : String(e)); });
  }

  // ── MASTER: Delete tenant + all its data ──────────────────────────────────────
  function deleteTenant(tenantId, tenantName, btn) {
    if (!confirm('OBRIŠI tenant "' + tenantName + '" + sve podatke?\n\nOva akcija je nepovratna!')) return;
    btn.disabled    = true;
    btn.textContent = 'Brišem…';

    function _done() {
      btn.disabled    = false;
      btn.textContent = 'Obriši';
      _allTenants = _allTenants.filter(function (t) { return t.tenant_id !== tenantId; });
      renderTenantsTable();
      setStatus(tenantsStatus, 'Tenant "' + tenantName + '" obrisan. ✓', 'info');
    }
    function _fail(msg) {
      btn.disabled    = false;
      btn.textContent = 'Obriši';
      setStatus(tenantsStatus, 'Greška pri brisanju tenanta: ' + msg, 'error');
    }

    sb.functions.invoke('master_admin', {
      body: { action: 'delete_tenant', tenant_id: tenantId }
    }).then(function (r) {
      if (!r.error) { _done(); return; }
      _deleteTenantFallback(tenantId, _done, _fail);
    }).catch(function () {
      _deleteTenantFallback(tenantId, _done, _fail);
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
      .in('item_key', ['default_config', 'house_rules_private', 'parking_recommended', 'rebook', 'owner_config'])
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
        // Support both old string format and new {sl,en} object format
        var _pTitle = park.title  || {};
        var _pNotes = park.notes  || {};
        if (masterParkingTitleSlInput) masterParkingTitleSlInput.value = (typeof _pTitle === 'object' ? _pTitle.sl : _pTitle) || '';
        if (masterParkingTitleEnInput) masterParkingTitleEnInput.value = (typeof _pTitle === 'object' ? _pTitle.en : _pTitle) || '';
        masterParkingAddressInput.value = park.address  || '';
        masterParkingMapsInput.value    = park.mapsLink || '';
        if (masterParkingHoursInput) masterParkingHoursInput.value = park.hours || '';
        if (masterParkingPaidChk)    masterParkingPaidChk.checked  = park.paid === true;
        if (masterParkingNotesSlArea) masterParkingNotesSlArea.value = (typeof _pNotes === 'object' ? _pNotes.sl : _pNotes) || '';
        if (masterParkingNotesEnArea) masterParkingNotesEnArea.value = (typeof _pNotes === 'object' ? _pNotes.en : _pNotes) || '';

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

        var biz = byKey['owner_config'] || {};
        if (masterBiznisEnabled)  masterBiznisEnabled.checked   = biz.enabled === true;
        // Load multilang name (backward compat: if string, put in sl)
        var BIZ_LANGS = ['sl','en','de','pl','cs','it'];
        var bizName = (biz.name && typeof biz.name === 'object') ? biz.name : {sl: biz.name || ''};
        var bizDesc = (biz.short_desc && typeof biz.short_desc === 'object') ? biz.short_desc : {sl: biz.short_desc || ''};
        BIZ_LANGS.forEach(function(lng) {
          var ni = document.getElementById('master-biznis-name-' + lng);
          var di = document.getElementById('master-biznis-desc-' + lng);
          if (ni) ni.value = bizName[lng] || '';
          if (di) di.value = bizDesc[lng] || '';
        });
        if (masterBiznisType)     masterBiznisType.value        = biz.type        || 'other';
        if (masterBiznisPhone)    masterBiznisPhone.value       = biz.phone       || '';
        if (masterBiznisWebsite)  masterBiznisWebsite.value     = biz.website     || '';
        if (masterBiznisBooking)  masterBiznisBooking.value     = biz.booking_url || '';
        if (masterBiznisImage)    masterBiznisImage.value       = biz.image_url   || '';
        if (masterBiznisLogo)     masterBiznisLogo.value        = biz.logo_url    || '';
        // Load existing image previews
        _loadExistingPreview(biz.logo_url,   mbLogoPreview,  mbLogoPreviewWrap,  mbLogoFilename,  true);
        _loadExistingPreview(biz.image_url,  mbImagePreview, mbImagePreviewWrap, mbImageFilename, false);
        if (mbUploadStatus) mbUploadStatus.style.display = 'none';

        masterTenantFields.classList.remove('hidden');
        clearStatus(masterSaveStatus);

        // Otvori parent <details> ako je zatvoren
        var detailsEl = masterTenantFields.closest('details');
        if (detailsEl) detailsEl.open = true;

        // Scroll to editor
        masterTenantFields.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
  }

  function esc(str) {
    return String(str || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── MASTER: Seed default items for a newly created tenant ────────────────────
  // Uses upsertItem() so ensureSectionExists() is called for every section key.
  function seedDefaultItems(tenantId, name) {
    return Promise.all([
      upsertItem(tenantId, 'info',        'default_config',      'config',  0, true, { apartment_name: name, quick_rules_url: './pravila/index.html' }),
      upsertItem(tenantId, 'house_rules', 'house_rules_private', 'rules',   0, true, { text: '' }),
      upsertItem(tenantId, 'parking',     'parking_recommended', 'parking', 0, true, { title: '', address: '', mapsLink: '', notes: '' }),
      upsertItem(tenantId, 'booking',     'rebook',              'config',  0, true, { apartment_name: name, owner_phone: '', owner_email: '', rebook_link: '', instructions: '' }),
      upsertItem(tenantId, 'maintenance', 'maintenance_config',  'config',  0, true, { visible: true, email: '' }),
      upsertItem(tenantId, 'biznis',      'owner_config',        'config',  0, false, { enabled: false, name: '', type: 'other', short_desc: '', phone: '', website: '', booking_url: '', image_url: '', logo_url: '' })
    ]);
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

        setStatus(createTenantStatus, 'Seedujem stavke…', 'info');
        seedDefaultItems(newId, name).catch(function (err) {
          setStatus(createTenantStatus, 'Apartman kreiran ✓, greška pri seedovanju: ' + (err && err.message || 'nepoznata'), 'warning');
        });

        if (!sendInvite || !email) {
          // Ako je email upisan ali se ne šalje pozivnica — svejedno ga sačuvaj
          // u pending_owner_invites da se ne izgubi (best-effort, ne blokira UI)
          if (email && !sendInvite) {
            sb.from('pending_owner_invites')
              .upsert({ email: email.toLowerCase(), tenant_id: newId }, { onConflict: 'email' })
              .catch(function () {});
          }
          unlockButtons();
          clearForm();
          setStatus(createTenantStatus, 'Apartman "' + name + '" kreiran! ✓', 'info');
          loadTenants();
          return;
        }

        // Pozovi send-owner-invite Edge Function — ona generiše magic link i šalje email
        setStatus(createTenantStatus, 'Šaljem pozivnicu ' + email + '…', 'info');
        console.log('[Admin Save+Send] invoke start', {
          function_name: 'send-owner-invite',
          tenant_id: newId,
          tenant_slug: slug,
          owner_email: email
        });

        function _afterInvite() {
          unlockButtons();
          setStatus(createTenantStatus, 'Apartman "' + name + '" kreiran! ✓', 'info');
          loadTenants();
          clearForm();
          showOwnerWelcomeModal(name, slug, email, true);
        }

        // Get fresh session token before invoking edge function
        sb.auth.getSession().then(function (sr) {
          if (sr.data && sr.data.session && sr.data.session.access_token) {
            return Promise.resolve();
          }
          return sb.auth.refreshSession().then(function () {}).catch(function () {});
        }).catch(function () {}).then(function () {
          return sb.functions.invoke('send-owner-invite', {
            body: {
              tenant_id:   newId,
              tenant_slug: slug,
              tenant_name: name,
              owner_email: email,
              locale:      'sl'
              // NO site_url / admin_url — edge function reads ONLY from env secrets
            }
          });
        }).then(function (fnResult) {
          console.log('[Admin Save+Send] invoke end', {
            ok: !fnResult.error && !!(fnResult.data && fnResult.data.ok),
            tenant_id: newId,
            owner_email: email,
            response: fnResult.data || null,
            error: fnResult.error || null
          });
          if (fnResult.error || !(fnResult.data && fnResult.data.ok)) {
            var errMsg = (fnResult.data && fnResult.data.error) || (fnResult.error && fnResult.error.message) || 'edge_function_failed';
            unlockButtons(); clearForm(); loadTenants();
            setStatus(createTenantStatus, 'Apartman kreiran ✓, ali slanje pozivnice nije uspjelo: ' + errMsg, 'error');
            showOwnerWelcomeModal(name, slug, email, false);
            return;
          }
          _afterInvite();
        }).catch(function (err) {
          console.error('[Admin Save+Send] invoke error', {
            function_name: 'send-owner-invite',
            tenant_id: newId,
            owner_email: email,
            error_message: err && err.message ? err.message : null
          });
          unlockButtons(); clearForm(); loadTenants();
          setStatus(createTenantStatus, 'Apartman kreiran ✓, ali slanje nije uspjelo: ' + (err && err.message || 'network'), 'error');
          showOwnerWelcomeModal(name, slug, email, false);
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
    { id: 'lost_found',       icon: '🔍', label: 'Izgubljeno & Nađeno' },
    { id: 'maintenance',      icon: '🔧', label: 'Prijava okvare' }
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
    // NULL tenant_id breaks onConflict upsert (NULL != NULL in PG unique constraints).
    // Use delete-then-insert to avoid phantom duplicates.
    ensureSectionExists('municipalities').then(function () {
      return sb.from('items').delete()
        .is('tenant_id', null)
        .eq('section_key', 'municipalities')
        .eq('item_key', 'list');
    }).then(function (dr) {
        if (dr && dr.error) {
          if (btnMunicipalitiesSave) btnMunicipalitiesSave.disabled = false;
          setStatus(municipalitiesSaveStatus, 'Greška: ' + dr.error.message, 'error');
          return;
        }
        return sb.from('items').insert({
          tenant_id: null, section_key: 'municipalities', item_key: 'list',
          type: 'config', order: 1, visible: true,
          data_json: { slugs: slugs },
          municipality_slugs: null, updated_at: new Date().toISOString()
        });
      }).then(function (r) {
        if (!r) return; // already returned after delete error
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
        type: 'link',
        tenant_id: null,
        data_json: { label_key: lk, url: url, custom_label: customLabel },
        municipality_slugs: (muns && muns.length) ? muns : null,
        visible: true,
        order: i
      });
    });
    if (deSaveStatus) { deSaveStatus.textContent = 'Čuvam…'; deSaveStatus.className = 'msg'; }
    ensureSectionExists('daily_essentials').then(function () {
    sb.from('items').delete().is('tenant_id', null).eq('section_key', 'daily_essentials')
      .then(function(d) {
        if (d.error) { if (deSaveStatus) { deSaveStatus.textContent = 'Greška pri brisanju: ' + d.error.message; deSaveStatus.className = 'msg msg--error'; } return; }
        if (!upserts.length) { if (deSaveStatus) { deSaveStatus.textContent = 'Sačuvano (prazno).'; deSaveStatus.className = 'msg msg--ok'; } return; }
        sb.from('items').insert(upserts).then(function(ins) {
          if (ins.error) { if (deSaveStatus) { deSaveStatus.textContent = 'Greška: ' + ins.error.message; deSaveStatus.className = 'msg msg--error'; } return; }
          if (deSaveStatus) { deSaveStatus.textContent = '✓ Sačuvano ' + upserts.length + ' linkova.'; deSaveStatus.className = 'msg msg--ok'; }
        });
      });
    }).catch(function(err) {
      if (deSaveStatus) { deSaveStatus.textContent = 'Greška: ' + (err && err.message ? err.message : err); deSaveStatus.className = 'msg msg--error'; }
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
  var pfCategoriesWrap    = document.getElementById('pf-categories-wrap');
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
  var pfCoverYoutubeUrl   = document.getElementById('pf-cover-youtube-url');
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
    // activities
    rafting:'Rafting', kayak:'Kajak', canyoning:'Kanjoning', zipline:'Zipline',
    cycling:'Kolesarstvo', paragliding:'Paragliding', skydiving:'Skydiving',
    // legacy activities (kept for backward compat with existing DB data)
    hiking:'Planinarenje', climbing:'Penjanje', other_act:'Ostalo',
    // food
    cafe:'Kavarna', street_food:'Street food', gostilna:'Gostilna',
    restaurant:'Restavracija', pizzeria:'Pizzerija',
    // legacy food
    bar:'Bar', bistro:'Bistro', brewery:'Pivovarna', other_food:'Ostalo',
    // taxi
    taxi:'Taksi',
    // legacy taxi
    transfer:'Transfer', bus:'Bus', other_taxi:'Ostalo',
    custom:'✏️ Prilagođena…'
  };
  var PARTNER_TYPE_LABELS = { activities:'🎯 Adrenalin', food:'🍽️ Restorani', taxi:'🚌 Taxi' };
  var PARTNER_TIER_LABELS = { premium:'⭐ Premium', featured:'🔥 Featured', standard:'📍 Standard' };
  var PARTNER_TIER_COLORS = { premium:'rgba(251,191,36,0.15)', featured:'rgba(249,115,22,0.1)', standard:'rgba(255,255,255,0.04)' };

  // ── Image upload helpers ──────────────────────────────────────────────────
  function _setupFileInput(fileInput, hiddenInput, previewImg, previewWrap, filenameSpan, folder, statusEl) {
    if (!fileInput) return;
    fileInput.addEventListener('change', function() {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(e) {
        if (previewImg)   previewImg.src = e.target.result;
        if (previewWrap)  previewWrap.style.display = 'block';
        if (filenameSpan) filenameSpan.textContent = file.name;
      };
      reader.readAsDataURL(file);
      _uploadImageToStorage(file, folder, hiddenInput, statusEl);
      fileInput.value = ''; // reset so same file re-selectable on next partner
    });
  }

  function _uploadImageToStorage(file, folder, hiddenInput, statusEl) {
    var sEl = statusEl || pfUploadStatus;
    if (sEl) { sEl.textContent = '⏳ Uploadujem…'; sEl.style.display = 'block'; sEl.style.color = '#22d3ee'; }
    var ext  = file.name.split('.').pop().toLowerCase();
    var name = folder + '/' + Date.now() + '_' + Math.random().toString(36).slice(2) + '.' + ext;
    Promise.resolve(
      sb.storage.from('partner-images').upload(name, file, { upsert: true, contentType: file.type })
    ).then(function(r) {
      if (r.error) {
        if (sEl) { sEl.textContent = '❌ Upload greška: ' + r.error.message; sEl.style.color = '#f87171'; }
        return;
      }
      var pub = sb.storage.from('partner-images').getPublicUrl(name);
      var url = pub && pub.data && pub.data.publicUrl ? pub.data.publicUrl : '';
      if (hiddenInput) hiddenInput.value = url;
      if (sEl) { sEl.textContent = '✅ Slika uploadovana'; sEl.style.color = '#4ade80'; setTimeout(function(){ sEl.style.display='none'; }, 3000); }
    }).catch(function(err) {
      if (sEl) { sEl.textContent = '❌ ' + (err && err.message ? err.message : 'Upload error'); sEl.style.color = '#f87171'; }
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

  // ── Biznis image upload wire-up ───────────────────────────────────────────
  _setupFileInput(mbLogoFile,  masterBiznisLogo,  mbLogoPreview,  mbLogoPreviewWrap,  mbLogoFilename,  'biznis-logos',  mbUploadStatus);
  _setupFileInput(mbImageFile, masterBiznisImage, mbImagePreview, mbImagePreviewWrap, mbImageFilename, 'biznis-heroes', mbUploadStatus);
  if (btnMbLogoClear)  btnMbLogoClear.addEventListener('click',  function() { _clearImageField(masterBiznisLogo,  mbLogoPreview,  mbLogoPreviewWrap,  mbLogoFilename,  mbLogoFile); });
  if (btnMbImageClear) btnMbImageClear.addEventListener('click', function() { _clearImageField(masterBiznisImage, mbImagePreview, mbImagePreviewWrap, mbImageFilename, mbImageFile); });

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

  // Sync category checkboxes based on type
  var CAT_BY_TYPE = {
    activities: ['rafting','kayak','canyoning','zipline','cycling','paragliding','skydiving'],
    food:       ['cafe','street_food','gostilna','restaurant','pizzeria'],
    taxi:       ['taxi']
  };

  function _syncCategoryByType(type, selectedArr) {
    if (!pfCategoriesWrap) return;
    // selectedArr = array of selected category keys, e.g. ['rafting','kayak']
    var cats = CAT_BY_TYPE[type] || [];
    pfCategoriesWrap.innerHTML = cats.map(function(c) {
      var checked = selectedArr && selectedArr.indexOf(c) >= 0;
      return '<label style="display:flex;align-items:center;gap:4px;font-size:0.8rem;opacity:0.85;' +
        'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:6px;' +
        'padding:3px 8px;cursor:pointer;user-select:none">' +
        '<input type="checkbox" class="pfc-cb" value="' + c + '"' + (checked ? ' checked' : '') +
        ' style="accent-color:#22d3ee;cursor:pointer"> ' +
        (PARTNER_CAT_LABELS[c] || c) + '</label>';
    }).join('');
  }

  function _getPartnerCatsSelected() {
    if (!pfCategoriesWrap) return [];
    return Array.from(pfCategoriesWrap.querySelectorAll('.pfc-cb:checked')).map(function(c) { return c.value; });
  }

  if (pfTypeSel) pfTypeSel.addEventListener('change', function() { _syncCategoryByType(this.value, []); });

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
      '<div style="min-width:0">' +
      '<span style="font-weight:600">' + _esc(p.name) + '</span>' +
      '<span style="margin-left:6px;font-size:0.7rem;background:rgba(34,211,238,0.12);color:#22d3ee;border-radius:4px;padding:1px 5px;font-weight:700" title="Redosled (order_index)">#' + (p.order_index || 100) + '</span>' +
      '</div></div>' +
      '<div style="display:flex;gap:0.3rem;flex-wrap:wrap;align-items:center">' +
      '<span style="font-size:0.72rem;opacity:0.6;background:rgba(255,255,255,0.06);padding:1px 6px;border-radius:4px">' + (PARTNER_TIER_LABELS[p.tier] || p.tier) + '</span>' +
      '<span style="font-size:0.72rem;opacity:0.6;background:rgba(255,255,255,0.06);padding:1px 6px;border-radius:4px">' + (PARTNER_TYPE_LABELS[p.type] || p.type) + '</span>' +
      '<span style="font-size:0.72rem;opacity:0.6">' + (function() {
        var cats = (p.categories && p.categories.length) ? p.categories : (p.category ? [p.category] : []);
        return cats.map(function(c) { return PARTNER_CAT_LABELS[c] || c; }).join(' · ') || '—';
      }()) + '</span>' +
      (!p.is_active ? '<span style="font-size:0.72rem;color:#f87171">● Neaktivan</span>' : '') +
      '<button class="btn-secondary btn-sm btn-p-up" data-pid="' + p.id + '" title="Pomeri gore (manji redosled)">▲</button>' +
      '<button class="btn-secondary btn-sm btn-p-down" data-pid="' + p.id + '" title="Pomeri dole (veći redosled)">▼</button>' +
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
    d.querySelector('.btn-p-up').addEventListener('click', function() { _reorderPartner(p, -10); });
    d.querySelector('.btn-p-down').addEventListener('click', function() { _reorderPartner(p, +10); });
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
    _syncCategoryByType(
      p ? p.type : 'activities',
      p ? (p.categories && p.categories.length ? p.categories : (p.category ? [p.category] : [])) : []
    );
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
    if (pfCoverYoutubeUrl) pfCoverYoutubeUrl.value = p ? (p.cover_youtube_url || '') : '';
    if (pfAllMun)   pfAllMun.checked = p ? !!p.all_municipalities : false;
    if (pfActive)   pfActive.checked = p ? !!p.is_active : true;
    _buildPartnerMunHtml(p ? (p.municipalities || []) : []);
    if (partnerFormStatus) { partnerFormStatus.className = 'msg hidden'; }
    partnerFormWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function _savePartner() {
    var name = pfName ? pfName.value.trim() : '';
    if (!name) { if (partnerFormStatus) { partnerFormStatus.textContent = 'Naziv je obavezan.'; partnerFormStatus.className = 'msg msg--error'; } return; }
    var ytCover = pfCoverYoutubeUrl ? pfCoverYoutubeUrl.value.trim() : '';
    if (ytCover && !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(ytCover)) {
      if (partnerFormStatus) {
        partnerFormStatus.textContent = 'YouTube cover mora biti validan youtube.com/youtu.be URL.';
        partnerFormStatus.className = 'msg msg--error';
      }
      return;
    }
    var id       = pfId      ? pfId.value.trim() : '';
    var allMun   = pfAllMun  ? pfAllMun.checked  : false;
    var muns     = allMun    ? null : _getPartnerMunSelected();
    var _selCats = _getPartnerCatsSelected();
    var payload  = {
      name:              name,
      type:              pfTypeSel  ? pfTypeSel.value  : 'activities',
      category:          _selCats[0] || 'other',
      categories:        _selCats.length ? _selCats : null,
      tier:              pfTierSel  ? pfTierSel.value  : 'standard',
      order_index:       pfOrder    ? (parseInt(pfOrder.value) || 100) : 100,
      short_desc:        pfDesc     ? pfDesc.value.trim()    || null : null,
      image_url:         pfImage    ? pfImage.value.trim()   || null : null,
      logo_url:          pfLogo     ? pfLogo.value.trim()    || null : null,
      phone:             pfPhone    ? pfPhone.value.trim()   || null : null,
      website_url:       pfWebsite  ? pfWebsite.value.trim() || null : null,
      booking_url:       pfBooking  ? pfBooking.value.trim() || null : null,
      cover_youtube_url: ytCover || null,
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

  function _reorderPartner(p, delta) {
    var newIndex = Math.max(1, (p.order_index || 100) + delta);
    sb.from('partners').update({ order_index: newIndex }).eq('id', p.id).then(function(r) {
      if (r.error) { alert('Greška pri promeni redosleda: ' + r.error.message); return; }
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

  // ── CSV Import ────────────────────────────────────────────────────────────
  (function() {
    var btnCsv          = document.getElementById('btn-partner-csv');
    var btnCsvTemplate  = document.getElementById('btn-partner-csv-template');
    var csvFileInput    = document.getElementById('csv-import-input');
    var csvModal        = document.getElementById('csv-import-modal');
    var csvModalClose   = document.getElementById('csv-modal-close');
    var csvModalCancel  = document.getElementById('csv-modal-cancel');
    var csvConfirm      = document.getElementById('csv-import-confirm');
    var csvInfo         = document.getElementById('csv-preview-info');
    var csvTable        = document.getElementById('csv-preview-table');
    var csvStatus       = document.getElementById('csv-import-status');

    var _parsedRows = [];

    var CSV_HEADERS = [
      'name','type','category','tier','order_index','short_desc',
      'phone','whatsapp','website_url','booking_url',
      'image_url','logo_url','municipalities','all_municipalities','is_active'
    ];

    var TEMPLATE_ROWS = [
      ['Rafting Soča','activities','rafting','featured','10','Adrenalinski rafting na smaragdni Soči','+38641111222','+38641111222','https://rafting.si','https://booking.si','','','bovec','FALSE','TRUE'],
      ['Restavracija Pri Mihi','food','restaurant','premium','20','Domača kuhinja s pogledom na reko','+38641333444','','https://primihi.si','','','','bovec,kobarid','FALSE','TRUE'],
      ['Taxi Bovec','taxi','taxi','standard','30','Prevoz po dolini Soče','+38641555666','+38641555666','','','','','','TRUE','TRUE']
    ];

    // ── Template download ─────────────────────────────────────────────────
    function _downloadTemplate() {
      var rows = [CSV_HEADERS.join(',')];
      TEMPLATE_ROWS.forEach(function(r) {
        rows.push(r.map(function(v) { return v.indexOf(',') >= 0 ? '"' + v + '"' : v; }).join(','));
      });
      var blob = new Blob([rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
      var url  = URL.createObjectURL(blob);
      var a    = document.createElement('a');
      a.href   = url;
      a.download = 'partneri-template.csv';
      a.click();
      setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
    }

    // ── CSV parser (handles quoted fields with commas) ────────────────────
    function _parseCSV(text) {
      var lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(function(l) { return l.trim(); });
      if (lines.length < 2) return [];

      function parseLine(line) {
        var result = [], cur = '', inQ = false;
        for (var i = 0; i < line.length; i++) {
          var c = line[i];
          if (c === '"') {
            if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
            else { inQ = !inQ; }
          } else if (c === ',' && !inQ) {
            result.push(cur); cur = '';
          } else {
            cur += c;
          }
        }
        result.push(cur);
        return result;
      }

      var headers = parseLine(lines[0]).map(function(h) { return h.trim().toLowerCase().replace(/\s+/g,'_'); });
      var rows = [];
      for (var i = 1; i < lines.length; i++) {
        var vals = parseLine(lines[i]);
        var obj  = {};
        headers.forEach(function(h, idx) { obj[h] = (vals[idx] || '').trim(); });
        if (obj.name) rows.push(obj); // skip empty rows
      }
      return rows;
    }

    // ── Convert CSV row → partner payload ────────────────────────────────
    function _rowToPayload(row) {
      var allMun = row.all_municipalities === 'TRUE' || row.all_municipalities === 'true' || row.all_municipalities === '1';
      var munRaw = row.municipalities || '';
      var muns   = munRaw ? munRaw.split(/[,;]+/).map(function(m) { return m.trim().toLowerCase(); }).filter(Boolean) : null;
      var validTypes = ['activities', 'food', 'taxi'];
      var validTiers = ['standard', 'featured', 'premium'];
      return {
        name:               row.name,
        type:               validTypes.indexOf(row.type) >= 0 ? row.type : 'activities',
        category:           row.category || 'other',
        tier:               validTiers.indexOf(row.tier) >= 0 ? row.tier : 'standard',
        order_index:        parseInt(row.order_index) || 100,
        short_desc:         row.short_desc  || null,
        image_url:          row.image_url   || null,
        logo_url:           row.logo_url    || null,
        phone:              row.phone       || null,
        whatsapp:           row.whatsapp    || null,
        website_url:        row.website_url || null,
        booking_url:        row.booking_url || null,
        municipalities:     (!allMun && muns && muns.length) ? muns : null,
        all_municipalities: allMun,
        is_active:          row.is_active !== 'FALSE' && row.is_active !== 'false' && row.is_active !== '0',
        updated_at:         new Date().toISOString()
      };
    }

    // ── Build preview table ───────────────────────────────────────────────
    var TYPE_LABELS  = { activities: '🎯 Aktivnosti', food: '🍽️ Hrana', taxi: '🚌 Taxi' };
    var TIER_LABELS  = { standard: '📍 Std', featured: '🔥 Feat', premium: '⭐ Prem' };

    function _buildPreview(rows) {
      var cols = ['#','Naziv','Tip','Kategorija','Tier','Red.','Telefon','Website','Opštine','Aktivan'];
      var head = '<thead><tr>' + cols.map(function(c) {
        return '<th style="padding:0.4rem 0.5rem;text-align:left;border-bottom:1px solid rgba(34,211,238,0.2);color:#22d3ee;white-space:nowrap;position:sticky;top:0;background:#0d2019">' + c + '</th>';
      }).join('') + '</tr></thead>';

      var body = '<tbody>' + rows.map(function(row, i) {
        var p = _rowToPayload(row);
        var ok = p.name && p.type;
        var bg = ok ? '' : 'background:rgba(239,68,68,0.08)';
        return '<tr style="' + bg + '">'
          + '<td style="padding:0.35rem 0.5rem;border-bottom:1px solid rgba(255,255,255,0.05);color:#6b7280">' + (i + 1) + '</td>'
          + '<td style="padding:0.35rem 0.5rem;border-bottom:1px solid rgba(255,255,255,0.05);font-weight:600;color:#e5e7eb;white-space:nowrap">' + (p.name || '<span style="color:#f87171">❌ prazno</span>') + '</td>'
          + '<td style="padding:0.35rem 0.5rem;border-bottom:1px solid rgba(255,255,255,0.05)">' + (TYPE_LABELS[p.type] || p.type) + '</td>'
          + '<td style="padding:0.35rem 0.5rem;border-bottom:1px solid rgba(255,255,255,0.05)">' + (p.category || '—') + '</td>'
          + '<td style="padding:0.35rem 0.5rem;border-bottom:1px solid rgba(255,255,255,0.05)">' + (TIER_LABELS[p.tier] || p.tier) + '</td>'
          + '<td style="padding:0.35rem 0.5rem;border-bottom:1px solid rgba(255,255,255,0.05);text-align:center">' + p.order_index + '</td>'
          + '<td style="padding:0.35rem 0.5rem;border-bottom:1px solid rgba(255,255,255,0.05)">' + (p.phone || '—') + '</td>'
          + '<td style="padding:0.35rem 0.5rem;border-bottom:1px solid rgba(255,255,255,0.05);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (p.website_url ? '<a href="' + p.website_url + '" target="_blank" style="color:#22d3ee">' + p.website_url.replace(/^https?:\/\//, '') + '</a>' : '—') + '</td>'
          + '<td style="padding:0.35rem 0.5rem;border-bottom:1px solid rgba(255,255,255,0.05)">' + (p.all_municipalities ? '<span style="color:#4ade80">Sve</span>' : (p.municipalities ? p.municipalities.join(', ') : '—')) + '</td>'
          + '<td style="padding:0.35rem 0.5rem;border-bottom:1px solid rgba(255,255,255,0.05);text-align:center">' + (p.is_active ? '✅' : '❌') + '</td>'
          + '</tr>';
      }).join('') + '</tbody>';

      csvTable.innerHTML = head + body;
    }

    // ── Show/hide modal ───────────────────────────────────────────────────
    function _openModal(rows) {
      _parsedRows = rows;
      var valid   = rows.filter(function(r) { return r.name; }).length;
      var invalid = rows.length - valid;
      csvInfo.innerHTML =
        '<strong style="color:#e5e7eb">' + rows.length + ' redova učitano</strong> — '
        + '<span style="color:#4ade80">' + valid + ' ispravnih</span>'
        + (invalid ? ' · <span style="color:#f87171">' + invalid + ' bez naziva (preskočeni)</span>' : '')
        + '<br><span style="font-size:0.75rem;opacity:0.6">Slike se ne uvoze automatski — dodaj ih naknadno kroz formu za svaki partner. Duplikati po nazivu NEĆE biti provereni.</span>';
      _buildPreview(rows);
      if (csvStatus) csvStatus.textContent = '';
      if (csvConfirm) { csvConfirm.disabled = false; csvConfirm.textContent = '✓ Uvezi sve partnere'; }
      csvModal.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }

    function _closeModal() {
      csvModal.style.display = 'none';
      document.body.style.overflow = '';
      if (csvFileInput) csvFileInput.value = '';
    }

    // ── Confirm import ────────────────────────────────────────────────────
    function _doImport() {
      var payloads = _parsedRows.filter(function(r) { return r.name; }).map(_rowToPayload);
      if (!payloads.length) { if (csvStatus) { csvStatus.textContent = 'Nema ispravnih redova.'; csvStatus.style.color = '#f87171'; } return; }
      if (!sb) { if (csvStatus) { csvStatus.textContent = 'Greška: Supabase nije dostupan.'; csvStatus.style.color = '#f87171'; } return; }
      if (csvConfirm) { csvConfirm.disabled = true; csvConfirm.textContent = 'Uvozim…'; }
      if (csvStatus) { csvStatus.textContent = 'Šaljem ' + payloads.length + ' partnera…'; csvStatus.style.color = '#9ca3af'; }

      // Chunk insert (max 50 per request to avoid Supabase limits)
      var CHUNK = 50;
      var chunks = [];
      for (var i = 0; i < payloads.length; i += CHUNK) { chunks.push(payloads.slice(i, i + CHUNK)); }

      var idx = 0;
      function nextChunk() {
        if (idx >= chunks.length) {
          if (csvStatus) { csvStatus.textContent = '✓ Uvezeno ' + payloads.length + ' partnera!'; csvStatus.style.color = '#4ade80'; }
          if (csvConfirm) { csvConfirm.textContent = '✓ Gotovo'; }
          loadPartners();
          setTimeout(_closeModal, 1800);
          return;
        }
        sb.from('partners').insert(chunks[idx]).then(function(r) {
          if (r.error) {
            if (csvStatus) { csvStatus.textContent = 'Greška: ' + r.error.message; csvStatus.style.color = '#f87171'; }
            if (csvConfirm) { csvConfirm.disabled = false; csvConfirm.textContent = '✓ Uvezi sve partnere'; }
            return;
          }
          idx++;
          if (csvStatus) csvStatus.textContent = 'Uvozim… (' + Math.min(idx * CHUNK, payloads.length) + '/' + payloads.length + ')';
          nextChunk();
        }).catch(function(err) {
          if (csvStatus) { csvStatus.textContent = 'Greška: ' + (err.message || err); csvStatus.style.color = '#f87171'; }
          if (csvConfirm) { csvConfirm.disabled = false; csvConfirm.textContent = '✓ Uvezi sve partnere'; }
        });
      }
      nextChunk();
    }

    // ── Event listeners ───────────────────────────────────────────────────
    // ── "Teren" link ──────────────────────────────────────────────────────
    var btnFieldLink = document.getElementById('btn-partner-field-link');
    if (btnFieldLink) {
      btnFieldLink.addEventListener('click', function() {
        var base = window.location.origin + window.location.pathname.replace(/\/admin\/[^/]*$/, '');
        var url  = base + '/partner-entry/';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function() {
            var orig = btnFieldLink.textContent;
            btnFieldLink.textContent = '✓ Kopirano!';
            setTimeout(function() { btnFieldLink.textContent = orig; }, 2000);
          }).catch(function() { prompt('Kopirajte link:', url); });
        } else {
          prompt('Kopirajte link:', url);
        }
      });
    }

    if (btnCsv)         btnCsv.addEventListener('click',  function() { if (csvFileInput) csvFileInput.click(); });
    if (btnCsvTemplate) btnCsvTemplate.addEventListener('click', _downloadTemplate);
    if (csvModalClose)  csvModalClose.addEventListener('click',  _closeModal);
    if (csvModalCancel) csvModalCancel.addEventListener('click', _closeModal);
    if (csvConfirm)     csvConfirm.addEventListener('click',     _doImport);
    if (csvModal)       csvModal.addEventListener('click', function(e) { if (e.target === csvModal) _closeModal(); });

    if (csvFileInput) {
      csvFileInput.addEventListener('change', function() {
        var file = csvFileInput.files && csvFileInput.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
          var rows = _parseCSV(e.target.result);
          if (!rows.length) {
            alert('CSV fajl je prazan ili ima pogrešan format. Proveri da li je prvi red zaglavlje.');
            return;
          }
          _openModal(rows);
        };
        reader.readAsText(file, 'UTF-8');
      });
    }
  })();

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
    // Delete+insert (upsert sa tenant_id=NULL ne radi zbog NULL conflict u PostgreSQL)
    ensureSectionExists('ui').then(function () {
    sb.from('items').delete()
      .eq('section_key', 'ui').eq('item_key', 'site_name').is('tenant_id', null)
      .then(function (dr) {
        if (dr.error) {
          if (btnGlobalSettingsSave) btnGlobalSettingsSave.disabled = false;
          setStatus(globalSettingsStatus, 'Greška: ' + dr.error.message, 'error');
          return;
        }
        sb.from('items').insert({
          tenant_id: null, section_key: 'ui', item_key: 'site_name',
          type: 'config', order: 1, visible: true,
          data_json: { name: name, subtitle: subtitle, admin_email: adminEmail, w3f_key: w3fKey },
          municipality_slugs: null, updated_at: new Date().toISOString()
        }).then(function (r) {
          if (btnGlobalSettingsSave) btnGlobalSettingsSave.disabled = false;
          if (r.error) { setStatus(globalSettingsStatus, 'Greška: ' + r.error.message, 'error'); return; }
          setStatus(globalSettingsStatus, 'Sačuvano ✓', 'success');
        }).catch(function (err) {
          if (btnGlobalSettingsSave) btnGlobalSettingsSave.disabled = false;
          setStatus(globalSettingsStatus, 'Greška: ' + (err && err.message ? err.message : err), 'error');
        });
      });
    }).catch(function (err) {
      if (btnGlobalSettingsSave) btnGlobalSettingsSave.disabled = false;
      setStatus(globalSettingsStatus, 'Greška: ' + (err && err.message ? err.message : err), 'error');
    });
  }

  if (btnGlobalSettingsSave) btnGlobalSettingsSave.addEventListener('click', saveGlobalSettings);

  // ── MASTER: Legal pages ───────────────────────────────────────────────────
  var legalSaveStatus   = document.getElementById('legal-save-status');
  var btnLegalSave      = document.getElementById('btn-legal-save');
  var LEGAL_KEYS = ['impressum', 'privacy', 'cookies', 'terms'];

  function loadLegalPages() {
    LEGAL_KEYS.forEach(function(k) {
      sb.from('items').select('data_json')
        .eq('section_key', 'ui').eq('item_key', 'legal_' + k).is('tenant_id', null)
        .maybeSingle()
        .then(function(r) {
          if (!r || !r.data || !r.data.data_json) return;
          var bh = r.data.data_json.body_html || {};
          var sl = document.getElementById('legal-' + k + '-sl');
          var en = document.getElementById('legal-' + k + '-en');
          if (sl) sl.value = bh.sl || '';
          if (en) en.value = bh.en || '';
        });
    });
  }

  function saveLegalPages() {
    if (btnLegalSave) btnLegalSave.disabled = true;
    setStatus(legalSaveStatus, 'Čuvam…', '');
    var TITLES = {
      impressum: { sl: 'Impressum',          en: 'Imprint' },
      privacy:   { sl: 'Politika zasebnosti', en: 'Privacy Policy' },
      cookies:   { sl: 'Piškotki',            en: 'Cookies' },
      terms:     { sl: 'Pogoji uporabe',       en: 'Terms of Use' }
    };

    // NULL tenant_id breaks standard upsert onConflict (NULL != NULL in PG).
    // Safe approach: ensure section, DELETE existing global rows, then INSERT fresh ones.
    ensureSectionExists('ui').then(function () {
    var deleteAll = sb.from('items')
      .delete()
      .is('tenant_id', null)
      .eq('section_key', 'ui')
      .in('item_key', LEGAL_KEYS.map(function(k){ return 'legal_' + k; }));

    deleteAll.then(function(delRes) {
      if (delRes && delRes.error) {
        if (btnLegalSave) btnLegalSave.disabled = false;
        setStatus(legalSaveStatus, 'Greška pri brisanju: ' + delRes.error.message, 'error');
        return;
      }
      var rows = LEGAL_KEYS.map(function(k, i) {
        var slEl = document.getElementById('legal-' + k + '-sl');
        var enEl = document.getElementById('legal-' + k + '-en');
        return {
          tenant_id: null, section_key: 'ui', item_key: 'legal_' + k,
          type: 'config', order: 20 + i, visible: true,
          data_json: {
            title:     TITLES[k],
            body_html: { sl: slEl ? slEl.value : '', en: enEl ? enEl.value : '' }
          },
          municipality_slugs: null,
          updated_at: new Date().toISOString()
        };
      });
      sb.from('items').insert(rows).then(function(insRes) {
        if (insRes && insRes.error) {
          if (btnLegalSave) btnLegalSave.disabled = false;
          setStatus(legalSaveStatus, 'Greška: ' + insRes.error.message, 'error');
          return;
        }
        // Also save footer_config with all 4 legal links so they appear in the footer
        var footerConfig = {
          copyright: { sl: '© 2026 Soča Guide', en: '© 2026 Soča Guide' },
          links: [
            { label: { sl: 'Impressum', en: 'Imprint' },        url: './legal/?doc=impressum', enabled: true },
            { label: { sl: 'Zasebnost', en: 'Privacy' },        url: './legal/?doc=privacy',   enabled: true },
            { label: { sl: 'Piškotki', en: 'Cookies' },         url: './legal/?doc=cookies',   enabled: true },
            { label: { sl: 'Pogoji',   en: 'Terms' },           url: './legal/?doc=terms',     enabled: true }
          ]
        };
        sb.from('items').delete()
          .eq('section_key', 'ui').eq('item_key', 'footer_config').is('tenant_id', null)
          .then(function() {
            return sb.from('items').insert({
              tenant_id: null, section_key: 'ui', item_key: 'footer_config',
              type: 'config', order: 10, visible: true,
              data_json: footerConfig, municipality_slugs: null
            });
          }).then(function() {
            if (btnLegalSave) btnLegalSave.disabled = false;
            setStatus(legalSaveStatus, 'Sačuvano ✓', 'success');
            loadLegalPages();
          }).catch(function(err) {
            if (btnLegalSave) btnLegalSave.disabled = false;
            setStatus(legalSaveStatus, 'Greška (footer): ' + (err && err.message ? err.message : err), 'error');
          });
      }).catch(function(err) {
        if (btnLegalSave) btnLegalSave.disabled = false;
        setStatus(legalSaveStatus, 'Greška: ' + (err && err.message ? err.message : err), 'error');
      });
    }).catch(function(err) {
      if (btnLegalSave) btnLegalSave.disabled = false;
      setStatus(legalSaveStatus, 'Greška: ' + (err && err.message ? err.message : err), 'error');
    });
    }).catch(function(err) {
      if (btnLegalSave) btnLegalSave.disabled = false;
      setStatus(legalSaveStatus, 'Greška: ' + (err && err.message ? err.message : err), 'error');
    });
  }

  if (btnLegalSave) btnLegalSave.addEventListener('click', saveLegalPages);

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
    // NULL tenant_id breaks onConflict upsert — use delete+insert (same as municipalities)
    ensureSectionExists('restaurants').then(function() {
      return sb.from('items').delete()
        .is('tenant_id', null).eq('section_key', 'restaurants');
    }).then(function(dr) {
      if (dr && dr.error) {
        if (btnRestaurantsSave) btnRestaurantsSave.disabled = false;
        setStatus(restaurantsSaveStatus, 'Greška pri brisanju: ' + dr.error.message, 'error');
        return;
      }
      return sb.from('items').insert(upserts);
    }).then(function(r) {
      if (!r) return;
      if (btnRestaurantsSave) btnRestaurantsSave.disabled = false;
      if (r.error) { setStatus(restaurantsSaveStatus, 'Greška: ' + r.error.message, 'error'); return; }
      setStatus(restaurantsSaveStatus, 'Sačuvano ✓', 'success');
      loadRestaurants();
    }).catch(function(err) {
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
        title:    { sl: (masterParkingTitleSlInput ? masterParkingTitleSlInput.value.trim() : ''), en: (masterParkingTitleEnInput ? masterParkingTitleEnInput.value.trim() : '') },
        address:  masterParkingAddressInput.value.trim(),
        mapsLink: parkMaps,
        hours:    masterParkingHoursInput    ? masterParkingHoursInput.value.trim()    : '',
        paid:     masterParkingPaidChk       ? masterParkingPaidChk.checked            : null,
        notes:    { sl: (masterParkingNotesSlArea ? masterParkingNotesSlArea.value.trim() : ''), en: (masterParkingNotesEnArea ? masterParkingNotesEnArea.value.trim() : '') }
      }),
      upsertItem(_masterTenantId, 'booking',     'rebook',              'config',  0, true, {
        apartment_name: masterRebookNameInput.value.trim(), owner_phone: masterRebookPhoneInput.value.trim(),
        owner_email: rebookEmail, rebook_link: masterRebookLinkInput.value.trim(),
        instructions: masterRebookInstructionsArea.value.trim()
      }),
      upsertItem(_masterTenantId, 'maintenance', 'maintenance_config',  'config',  0, true, {
        visible: masterMaintVisibleChk ? masterMaintVisibleChk.checked : true,
        email:   masterMaintEmailInput ? masterMaintEmailInput.value.trim() : ''
      }),
      (function(){
        var BIZ_LANGS = ['sl','en','de','pl','cs','it'];
        var bizNameObj = {}, bizDescObj = {};
        BIZ_LANGS.forEach(function(lng) {
          var ni = document.getElementById('master-biznis-name-' + lng);
          var di = document.getElementById('master-biznis-desc-' + lng);
          bizNameObj[lng] = ni ? ni.value.trim() : '';
          bizDescObj[lng] = di ? di.value.trim() : '';
        });
        return upsertItem(_masterTenantId, 'biznis', 'owner_config', 'config', 0,
          masterBiznisEnabled ? masterBiznisEnabled.checked : false,
          {
            enabled:     masterBiznisEnabled  ? masterBiznisEnabled.checked : false,
            name:        bizNameObj,
            type:        masterBiznisType     ? masterBiznisType.value      : 'other',
            short_desc:  bizDescObj,
            phone:       masterBiznisPhone    ? masterBiznisPhone.value.trim()    : '',
            website:     masterBiznisWebsite  ? masterBiznisWebsite.value.trim()  : '',
            booking_url: masterBiznisBooking  ? masterBiznisBooking.value.trim()  : '',
            image_url:   masterBiznisImage    ? masterBiznisImage.value.trim()    : '',
            logo_url:    masterBiznisLogo     ? masterBiznisLogo.value.trim()     : ''
          }
        );
      })()
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
      .in('item_key', ['default_config', 'house_rules_private', 'parking_recommended', 'rebook', 'maintenance_config'])
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
        var _rulesI18n = rules.text_i18n || {};
        var _rulesText = (typeof rules.text === 'string') ? rules.text : (rules.text || {});
        LANG_LIST.forEach(function(lng) {
          var el = document.getElementById('owner-rules-text-' + lng);
          if (el) {
            var v = '';
            if (typeof _rulesI18n === 'object' && _rulesI18n && _rulesI18n[lng]) v = _rulesI18n[lng];
            else if (typeof _rulesText === 'object' && _rulesText && _rulesText[lng]) v = _rulesText[lng];
            else if (lng === 'sl' && typeof _rulesText === 'string') v = _rulesText;
            el.value = v || '';
          }
        });

        // parking_recommended
        var park = byKey['parking_recommended'] || {};
        _ownerData.parkingRecommended = park;
        var _opTitle = park.title || {};
        var _opNotes = park.notes || {};
        // Load all 6 language tabs for title and notes
        PARK_LANGS.forEach(function(lng) {
          var ti = document.getElementById('owner-parking-title-' + lng);
          var ni = document.getElementById('owner-parking-notes-' + lng);
          if (ti) ti.value = (typeof _opTitle === 'object' ? _opTitle[lng] : (lng === 'sl' ? _opTitle : '')) || '';
          if (ni) ni.value = (typeof _opNotes === 'object' ? _opNotes[lng] : (lng === 'sl' ? _opNotes : '')) || '';
        });
        ownerParkingAddressInput.value = park.address  || '';
        ownerParkingMapsInput.value    = park.mapsLink || '';
        if (ownerParkingHoursInput) ownerParkingHoursInput.value = park.hours || '';
        if (ownerParkingPaidChk)    ownerParkingPaidChk.checked  = park.paid === true;

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
    var _rulesTextObj = {};
    LANG_LIST.forEach(function(lng) {
      var el = document.getElementById('owner-rules-text-' + lng);
      _rulesTextObj[lng] = el ? el.value.trim() : '';
    });
    var _parkTitleObj = {}, _parkNotesObj = {};
    PARK_LANGS.forEach(function(lng) {
      var ti = document.getElementById('owner-parking-title-' + lng);
      var ni = document.getElementById('owner-parking-notes-' + lng);
      _parkTitleObj[lng] = ti ? ti.value.trim() : '';
      _parkNotesObj[lng] = ni ? ni.value.trim() : '';
    });
    var parkAddr      = ownerParkingAddressInput.value.trim();
    var parkMaps      = ownerParkingMapsInput.value.trim();
    var parkHours     = ownerParkingHoursInput    ? ownerParkingHoursInput.value.trim()  : '';
    var parkPaid      = ownerParkingPaidChk       ? ownerParkingPaidChk.checked          : null;
    var rebookName    = ownerRebookNameInput.value.trim();
    var rebookPhone   = ownerRebookPhoneInput.value.trim();
    var rebookEmail   = ownerRebookEmailInput.value.trim();
    var rebookLink    = ownerRebookLinkInput.value.trim();
    var rebookInstr   = ownerRebookInstructionsArea.value.trim();
    var maintVisible  = true; // card always visible; only MASTER can control this
    var maintEmail    = ownerMaintEmailInput  ? ownerMaintEmailInput.value.trim()  : '';
    var maintW3f      = ownerMaintW3fInput    ? ownerMaintW3fInput.value.trim()    : '';

    
    if (!isValidLink(dirLink)) {
      setStatus(ownerSaveStatus, 'Link za navigaciju nije validan (http://, https:// ili ./).', 'error');
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

    var _rulesDefault = (_rulesTextObj.sl || _rulesTextObj.en || _rulesTextObj.de || _rulesTextObj.it || _rulesTextObj.pl || _rulesTextObj.cs || '').trim();
    var houseRulesData = { text: _rulesDefault, text_i18n: _rulesTextObj };
    var parkingData    = { title: _parkTitleObj, address: parkAddr, mapsLink: parkMaps, hours: parkHours, paid: parkPaid, notes: _parkNotesObj };
    var rebookData     = { apartment_name: rebookName, owner_phone: rebookPhone, owner_email: rebookEmail, rebook_link: rebookLink, instructions: rebookInstr };
    var maintData      = { visible: maintVisible, email: maintEmail };

    console.log('[Owner Save] house rules start', {
      tenant_id: _ownerTenantId,
      item_key: 'house_rules_private',
      lang: 'sl',
      has_text: !!_rulesDefault
    });

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
      console.log('[Owner Save] house rules success', {
        tenant_id: _ownerTenantId,
        item_key: 'house_rules_private',
        lang: 'sl'
      });
      setStatus(ownerSaveStatus, 'Sačuvano! ✓', 'info');
    }).catch(function (err) {
      btnOwnerSave.disabled = false;
      console.error('[Owner Save] house rules error', {
        tenant_id: _ownerTenantId,
        item_key: 'house_rules_private',
        lang: 'sl',
        error: err && err.message ? err.message : err
      });
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

  // Timeout handle — set in boot section, cleared when dashboard fully loads
  var _loaderTimeout = null;

  function hideDashStatus() {
    dashStatus.className = 'msg hidden';
    if (_loaderTimeout) { clearTimeout(_loaderTimeout); _loaderTimeout = null; }
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
          // No profile yet — check if there's a pending owner invite for this email
          showDashStatus('Provjavam pozivnicu…', 'info');
          sb.rpc('claim_owner_invite').then(function(claimRes) {
            if (claimRes.error || !claimRes.data || !claimRes.data[0] || !claimRes.data[0].claimed) {
              showDashStatus('Nema profila — kontaktiraj admina.', 'warning');
              dashRole.textContent   = 'nema';
              dashTenant.textContent = 'n/a';
              return;
            }
            // Invite claimed — reload profile
            showDashStatus('Profil kreiran ✓ Učitavam…', 'info');
            setTimeout(function() { loadProfile(userId); }, 800);
          }).catch(function() {
            showDashStatus('Nema profila — kontaktiraj admina.', 'warning');
            dashRole.textContent   = 'nema';
            dashTenant.textContent = 'n/a';
          });
          return;
        }

        _currentRole = data.role || null;
        dashRole.textContent   = data.role   || '—';
        dashTenant.textContent = data.tenant_id || 'null';
        hideDashStatus();

        if (data.role === 'MASTER') {
          // If URL has ?view=owner&t=slug, master previews owner panel for that tenant
          var _urlParams  = new URLSearchParams(window.location.search);
          var _viewParam  = _urlParams.get('view');
          var _slugParam  = _urlParams.get('t');
          if (_viewParam === 'owner' && _slugParam) {
            // Fetch tenant_id for slug, then load owner panel
            sb.from('tenants').select('tenant_id').eq('slug', _slugParam).maybeSingle()
              .then(function(tr) {
                if (tr.error || !tr.data) {
                  masterPanel.classList.remove('hidden');
                } else {
                  ownerPanel.classList.remove('hidden');
                  loadOwnerEditableData(tr.data.tenant_id);
                  // Sakrij ulogu/tenant_id kao za pravog OWNER-a; prikaži samo email VLASNIKA
                  var _rblk = document.getElementById('info-block-role');
                  if (_rblk) _rblk.style.display = 'none';
                  sb.from('user_profiles').select('email').eq('tenant_id', tr.data.tenant_id).eq('role', 'OWNER').maybeSingle()
                    .then(function(pr) {
                      var ownerEmail = (pr.data && pr.data.email) ? pr.data.email : null;
                      if (!ownerEmail) {
                        return sb.from('pending_owner_invites').select('email').eq('tenant_id', tr.data.tenant_id).maybeSingle();
                      }
                      return { data: { email: ownerEmail } };
                    })
                    .then(function(r) {
                      var email = (r && r.data && r.data.email) ? r.data.email : '—';
                      var lbl = document.querySelector('#info-block-email .label');
                      if (lbl) lbl.textContent = 'Vlasnik: ';
                      dashEmail.textContent = email;
                    })
                    .catch(function() {});
                }
              }).catch(function() { masterPanel.classList.remove('hidden'); });
          } else {
            masterPanel.classList.remove('hidden');
          }
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
          loadLegalPages();
          loadCardLabels();
          loadSporocila();
        } else if (data.role === 'OWNER') {
          // Hide email + role/tenant_id info blocks from owners
          var _eblk = document.getElementById('info-block-email');
          var _rblk = document.getElementById('info-block-role');
          if (_eblk) _eblk.style.display = 'none';
          if (_rblk) _rblk.style.display = 'none';
          if (data.disabled) {
            showDashStatus(
              'Dostop je onemogočen. Kontaktirajte administratorja.', 'warning');
          } else if (!data.tenant_id) {
            showDashStatus('Nalog još nije povezan sa apartmanom. Kontaktiraj podršku.', 'warning');
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

  // ── Magic link login (za vlasnike bez lozinke ili kao fallback) ───────────────
  var btnMagicLogin  = document.getElementById('btn-magic-login');
  var magicLoginMsg  = document.getElementById('magic-login-msg');

  if (btnMagicLogin) {
    btnMagicLogin.addEventListener('click', function () {
      var email = inputEmail.value.trim();
      if (!email || email.indexOf('@') < 0) {
        if (magicLoginMsg) { magicLoginMsg.className = 'msg error'; magicLoginMsg.textContent = 'Unesite e-mail adresu.'; }
        return;
      }
      btnMagicLogin.disabled    = true;
      btnMagicLogin.textContent = 'Šaljem…';
      if (magicLoginMsg) magicLoginMsg.className = 'msg hidden';

      sb.auth.signInWithOtp({
        email: email,
        options: { shouldCreateUser: false, emailRedirectTo: window.location.origin + '/admin/' }
      }).then(function (r) {
        btnMagicLogin.disabled    = false;
        btnMagicLogin.textContent = '🔗 Pošalji magic link na email';
        if (r.error) {
          if (magicLoginMsg) { magicLoginMsg.className = 'msg error'; magicLoginMsg.textContent = r.error.message; }
        } else {
          if (magicLoginMsg) { magicLoginMsg.className = 'msg'; magicLoginMsg.style.color = '#4ade80'; magicLoginMsg.textContent = 'Link poslan! Provjeri email i klikni link za prijavu.'; }
        }
      }).catch(function (err) {
        btnMagicLogin.disabled    = false;
        btnMagicLogin.textContent = '🔗 Pošalji magic link na email';
        if (magicLoginMsg) { magicLoginMsg.className = 'msg error'; magicLoginMsg.textContent = err && err.message ? err.message : 'Greška'; }
      });
    });
  }

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

    // ── Invite owner for tenant without owner ("—") ──
    if (btn.classList.contains('btn-invite-owner')) {
      var _ioEmail = prompt('E-mail vlasnika za "' + btn.getAttribute('data-name') + '":');
      if (!_ioEmail || _ioEmail.indexOf('@') < 0) return;
      _ioEmail = _ioEmail.trim().toLowerCase();
      btn.disabled    = true;
      btn.textContent = 'Šaljem…';
      var _ioTid  = btn.getAttribute('data-tid');
      var _ioSlug = btn.getAttribute('data-slug');
      var _ioName = btn.getAttribute('data-name');
      console.log('[Admin InviteOwner] invoke start', { function_name: 'send-owner-invite', tenant_id: _ioTid, tenant_slug: _ioSlug, owner_email: _ioEmail });
      sb.functions.invoke('send-owner-invite', {
        body: {
          tenant_id:   _ioTid,
          tenant_slug: _ioSlug,
          tenant_name: _ioName,
          owner_email: _ioEmail,
          locale:      'sl',
          admin_url:   window.location.origin + '/admin',
          site_url:    window.location.origin
        }
      }).then(function (r) {
        console.log('[Admin InviteOwner] invoke end', {
          tenant_id: _ioTid,
          owner_email: _ioEmail,
          ok: !r.error && !!(r.data && r.data.ok),
          response: r.data || null,
          error: r.error || null
        });
        if (r.error || !(r.data && r.data.ok)) {
          btn.disabled    = false;
          btn.textContent = '+ Poveži vlasnika';
          setStatus(tenantsStatus, 'Greška: ' + ((r.data && r.data.error) || r.error || 'unknown'), 'error');
          return;
        }
        setStatus(tenantsStatus, 'Pozivnica poslata na ' + _ioEmail + ' ✓', 'info');
        loadTenants();
      }).catch(function (err) {
        console.error('[Admin InviteOwner] invoke error', {
          function_name: 'send-owner-invite',
          tenant_id: _ioTid,
          owner_email: _ioEmail,
          error_message: err && err.message ? err.message : null,
          error: err || null
        });
        btn.disabled    = false;
        btn.textContent = '+ Poveži vlasnika';
        setStatus(tenantsStatus, 'Greška: ' + (err && err.message ? err.message : 'network'), 'error');
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

  btnCreateTenant.addEventListener('click', function () {
    var email = quickOwnerEmailInput ? quickOwnerEmailInput.value.trim() : '';
    // If email is filled, treat as invite flow automatically
    quickAddTenant(!!email);
  });
  if (btnQuickInvite) btnQuickInvite.addEventListener('click', function () { quickAddTenant(true); });

  btnLinkOwner.addEventListener('click', linkOwnerToTenant);

  // ── Owner welcome modal ───────────────────────────────────────────────────────
  var _owmModal     = document.getElementById('owner-welcome-modal');
  var _owmGuestUrl  = document.getElementById('owm-guest-url');
  var _owmAdminUrl  = document.getElementById('owm-admin-url');
  var _owmMsg       = document.getElementById('owm-copy-msg');
  var _owmNote      = document.getElementById('owm-invite-note');

  function showOwnerWelcomeModal(tenantName, tenantSlug, ownerEmail, inviteSent) {
    if (!_owmModal) return;
    var base      = window.location.origin + window.location.pathname.replace(/\/admin\/[^/]*$/, '');
    var guestUrl  = base + '/index.html?t=' + encodeURIComponent(tenantSlug);
    var adminUrl  = window.location.origin + '/admin/';

    if (_owmNote) {
      _owmNote.textContent = inviteSent && ownerEmail
        ? '✅ Magic link poslan na ' + ownerEmail + '. Prosledi vlasniku i guest link ispod.'
        : '⚠️ Email nije poslan — pošalji vlasniku ove podatke ručno.';
      _owmNote.style.color = inviteSent ? '#4ade80' : '#fbbf24';
    }
    if (_owmGuestUrl) _owmGuestUrl.textContent = guestUrl;
    if (_owmAdminUrl) _owmAdminUrl.textContent = adminUrl;
    if (_owmMsg) {
      _owmMsg.value = [
        'Zdravo!',
        '',
        'Kreiran je tvoj apartman "' + tenantName + '" na Soča Guide platformi.',
        '',
        '🔑 Admin panel (upravljaj apartmanom):',
        adminUrl,
        '',
        '🔗 Link za goste (daj gostima da otvore vodič):',
        guestUrl,
        '',
        (inviteSent && ownerEmail
          ? 'Na tvoj email (' + ownerEmail + ') smo poslali magic link za prijavu.\nKlikni na link u emailu da se prijaviš u admin panel.'
          : 'Otvori admin panel i prijavi se sa svojim emailom koristeći "Pošalji magic link" opciju.'),
        '',
        'Pozdrav!'
      ].join('\n');
    }

    _owmModal.style.display = 'block';

    function _copyText(text, btn, label) {
      navigator.clipboard ? navigator.clipboard.writeText(text).then(function () {
        var orig = btn.textContent; btn.textContent = 'Kopirano ✓';
        setTimeout(function () { btn.textContent = orig; }, 2000);
      }) : (function () {
        var ta = document.createElement('textarea'); ta.value = text;
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta);
        btn.textContent = 'Kopirano ✓'; setTimeout(function () { btn.textContent = label; }, 2000);
      })();
    }

    var cg = document.getElementById('owm-copy-guest');
    var ca = document.getElementById('owm-copy-admin');
    var cm = document.getElementById('owm-copy-msg-btn');
    if (cg) cg.onclick = function () { _copyText(guestUrl, cg, 'Kopiraj'); };
    if (ca) ca.onclick = function () { _copyText(adminUrl, ca, 'Kopiraj'); };
    if (cm) cm.onclick = function () { _copyText(_owmMsg ? _owmMsg.value : '', cm, 'Kopiraj poruku'); };
  }

  function closeOwnerWelcomeModal() { if (_owmModal) _owmModal.style.display = 'none'; }
  var _owmClose1 = document.getElementById('owner-welcome-close');
  var _owmClose2 = document.getElementById('owner-welcome-close2');
  if (_owmClose1) _owmClose1.addEventListener('click', closeOwnerWelcomeModal);
  if (_owmClose2) _owmClose2.addEventListener('click', closeOwnerWelcomeModal);
  if (_owmModal)  _owmModal.addEventListener('click', function (e) {
    if (e.target === _owmModal) closeOwnerWelcomeModal();
  });

  // Expose so quickAddTenant can call it
  window._showOwnerWelcomeModal = showOwnerWelcomeModal;

  // ── Sporočila (Lost & Found) — master panel only ─────────────────────────────
  function loadSporocila(_retry) {
    if (!sporocilaList) return;
    if (!_retry) sporocilaList.innerHTML = '<span style="color:#9ca3af">Nalagam…</span>';
    // Use RPC (SECURITY DEFINER) to bypass RLS for both anon and authenticated roles
    sb.rpc('get_lost_found_posts_public', { p_tenant_slug: null, p_limit: 200 })
      .then(function(r) {
        if (r.error) {
          console.error('[loadSporocila] RPC error:', r.error.message, r.error.code);
          if (!_retry) { setTimeout(function() { loadSporocila(true); }, 2000); }
          else { sporocilaList.innerHTML = '<span style="color:#f87171">Napaka: ' + r.error.message + '</span>'; }
          return;
        }
        var noMsgLabel = 'Ni sporočil v zadnjih 10 dneh.';
        var html;
        if (!r.data || !r.data.length) {
          // No data on first try — retry once after 2s (handles auth token timing edge case)
          if (!_retry) {
            setTimeout(function() { loadSporocila(true); }, 2000);
            return;
          }
          sporocilaList.innerHTML = '<span style="color:#9ca3af">' + noMsgLabel + '</span>';
          return;
        }
        sporocilaList.innerHTML = r.data.map(function(x) {
          var d = new Date(x.created_at).toLocaleString('sl-SI');
          return '<div style="border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:8px 10px;margin-bottom:6px">' +
            '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px;margin-bottom:4px">' +
            '<span style="color:#6ee7b7;font-size:0.78rem">' + esc(x.email || '') + (x.tenant_slug ? ' <em style="opacity:0.6">@' + esc(x.tenant_slug) + '</em>' : '') + '</span>' +
            '<span style="color:#9ca3af;font-size:0.72rem">' + d + '</span>' +
            '</div>' +
            '<div style="font-size:0.82rem;white-space:pre-wrap">' + esc(x.message) + '</div>' +
            '</div>';
        }).join('');
      })
      .catch(function(err) {
        console.error('[loadSporocila] fetch failed:', err);
        if (!_retry) { setTimeout(function() { loadSporocila(true); }, 2000); }
        else { sporocilaList.innerHTML = '<span style="color:#f87171">Napaka pri nalaganju.</span>'; }
      });
  }

  if (btnLoadSporocila) {
    btnLoadSporocila.addEventListener('click', function() { loadSporocila(); });
    var _sporocilaDetails = document.getElementById('sporocila-section');
    if (_sporocilaDetails) _sporocilaDetails.addEventListener('toggle', function() {
      if (_sporocilaDetails.open && sporocilaList && !sporocilaList.innerHTML) loadSporocila();
    });
  }

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
      if (ownerParkingTitleSlInput) ownerParkingTitleSlInput.value = '';
      if (ownerParkingTitleEnInput) ownerParkingTitleEnInput.value = '';
      ownerParkingAddressInput.value = '';
      ownerParkingMapsInput.value    = '';
      if (ownerParkingNotesSlArea) ownerParkingNotesSlArea.value = '';
      if (ownerParkingNotesEnArea) ownerParkingNotesEnArea.value = '';
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
      if (masterParkingTitleSlInput) masterParkingTitleSlInput.value = '';
      if (masterParkingTitleEnInput) masterParkingTitleEnInput.value = '';
      masterParkingAddressInput.value      = '';
      masterParkingMapsInput.value         = '';
      if (masterParkingNotesSlArea) masterParkingNotesSlArea.value = '';
      if (masterParkingNotesEnArea) masterParkingNotesEnArea.value = '';
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

  // ── Card Labels (main page card names) ───────────────────────────────────────
  var CARD_LABEL_DEFS = [
    { key: 'emergency',         label: 'Nujno / Emergency',          icon: '🚨' },
    { key: 'parking',           label: 'Parkiranje / Parking',        icon: '🅿️' },
    { key: 'restavracije_title',label: 'Restavracije / Restaurants',  icon: '🍽️' },
    { key: 'adrenalin',         label: 'Adrenalin / Activities',      icon: '🎯' },
    { key: 'attractions',       label: 'Znamenitosti / Attractions',  icon: '⭐' },
    { key: 'daily_essentials',  label: 'Daily Essentials',            icon: '🛒' },
    { key: 'taxi_bus',          label: 'Taxi',                        icon: '🚌' },
    { key: 'soca_live_title',   label: 'Soča Live',                   icon: '🌊' },
    { key: 'lost_found_title',  label: 'Izgubljeno / Lost & Found',   icon: '🔍' },
    { key: 'maint_card_title',  label: 'Prijava okvare / Maintenance',icon: '🔧' },
  ];
  var CARD_LABEL_LANGS = [
    { code: 'sl', flag: '🇸🇮' },
    { code: 'en', flag: '🇬🇧' },
    { code: 'de', flag: '🇩🇪' },
    { code: 'it', flag: '🇮🇹' },
    { code: 'pl', flag: '🇵🇱' },
    { code: 'cs', flag: '🇨🇿' },
  ];
  var _clActiveLang = 'sl';
  var _clData = {}; // { sl: { emergency: '...', emergency_sub: '...' }, en: {...}, ... }

  function _buildCardLabelPanels() {
    var wrap = document.getElementById('cl-panels');
    if (!wrap) return;
    wrap.innerHTML = '';
    CARD_LABEL_LANGS.forEach(function(lng) {
      var panel = document.createElement('div');
      panel.id = 'cl-panel-' + lng.code;
      panel.style.display = lng.code === _clActiveLang ? 'block' : 'none';
      var html = '<div style="display:grid;grid-template-columns:1fr;gap:0.5rem">';
      CARD_LABEL_DEFS.forEach(function(def) {
        var titleVal = (_clData[lng.code] && _clData[lng.code][def.key]) || '';
        var subKey   = def.key.replace(/_title$/, '') + '_sub';
        var subVal   = (_clData[lng.code] && _clData[lng.code][subKey]) || '';
        html +=
          '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:0.6rem 0.75rem">' +
          '<div style="font-size:0.78rem;font-weight:700;margin-bottom:0.4rem;opacity:0.8">' + def.icon + ' ' + _esc(def.label) + '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.4rem">' +
          '<div>' +
          '<label style="font-size:0.72rem;opacity:0.55">Naslov</label>' +
          '<input type="text" id="cl-' + lng.code + '-' + def.key + '" placeholder="(podrazumevani prevod)" style="width:100%;box-sizing:border-box;font-size:0.82rem" value="' + _esc(titleVal) + '">' +
          '</div>' +
          '<div>' +
          '<label style="font-size:0.72rem;opacity:0.55">Podnaslov</label>' +
          '<input type="text" id="cl-' + lng.code + '-' + subKey + '" placeholder="(podrazumevani prevod)" style="width:100%;box-sizing:border-box;font-size:0.82rem" value="' + _esc(subVal) + '">' +
          '</div>' +
          '</div></div>';
      });
      html += '</div>';
      panel.innerHTML = html;
      wrap.appendChild(panel);
    });
  }

  function loadCardLabels() {
    sb.from('items')
      .select('data_json')
      .eq('item_key', 'card_labels')
      .is('tenant_id', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(function(r) {
        if (r.error) { console.warn('[loadCardLabels]', r.error); }
        _clData = (r.data && r.data.data_json) || {};
        _buildCardLabelPanels();
        _initCardLabelTabs();
      });
  }

  function _initCardLabelTabs() {
    var tabs = document.querySelectorAll('.cl-lang-btn');
    tabs.forEach(function(btn) {
      btn.addEventListener('click', function() {
        _clActiveLang = this.getAttribute('data-lang');
        tabs.forEach(function(b) { b.classList.remove('active'); });
        this.classList.add('active');
        CARD_LABEL_LANGS.forEach(function(lng) {
          var p = document.getElementById('cl-panel-' + lng.code);
          if (p) p.style.display = lng.code === _clActiveLang ? 'block' : 'none';
        });
      });
    });
  }

  var btnCardLabelsSave = document.getElementById('btn-card-labels-save');
  var cardLabelsStatus  = document.getElementById('card-labels-status');

  if (btnCardLabelsSave) {
    btnCardLabelsSave.addEventListener('click', function() {
      // Collect all values from inputs
      var payload = {};
      CARD_LABEL_LANGS.forEach(function(lng) {
        payload[lng.code] = {};
        CARD_LABEL_DEFS.forEach(function(def) {
          var titleEl = document.getElementById('cl-' + lng.code + '-' + def.key);
          var subKey  = def.key.replace(/_title$/, '') + '_sub';
          var subEl   = document.getElementById('cl-' + lng.code + '-' + subKey);
          var tv = titleEl ? titleEl.value.trim() : '';
          var sv = subEl   ? subEl.value.trim()   : '';
          if (tv) payload[lng.code][def.key] = tv;
          if (sv) payload[lng.code][subKey]  = sv;
        });
      });

      btnCardLabelsSave.disabled = true;
      if (cardLabelsStatus) { cardLabelsStatus.textContent = 'Čuvam…'; cardLabelsStatus.className = 'msg'; cardLabelsStatus.classList.remove('hidden'); }

      // Ensure 'ui' section exists, then delete-and-insert card_labels
      ensureSectionExists('ui').then(function() {
        return sb.from('items').delete().eq('section_key', 'ui').eq('item_key', 'card_labels').is('tenant_id', null);
      }).then(function(dr) {
          if (dr.error) {
            btnCardLabelsSave.disabled = false;
            if (cardLabelsStatus) { cardLabelsStatus.textContent = 'Greška: ' + dr.error.message; cardLabelsStatus.className = 'msg msg--error'; }
            return;
          }
          return sb.from('items').insert({
            item_key:   'card_labels',
            section_key:'ui',
            type:       'config',
            tenant_id:  null,
            data_json:  payload,
          });
        }).then(function(ir) {
          if (!ir) return;
          btnCardLabelsSave.disabled = false;
          if (ir.error) {
            if (cardLabelsStatus) { cardLabelsStatus.textContent = 'Greška: ' + ir.error.message; cardLabelsStatus.className = 'msg msg--error'; }
            return;
          }
          _clData = payload;
          if (cardLabelsStatus) { cardLabelsStatus.textContent = '✓ Nazivi kartica sačuvani!'; cardLabelsStatus.className = 'msg msg--ok'; }
        }).catch(function(err) {
          btnCardLabelsSave.disabled = false;
          if (cardLabelsStatus) { cardLabelsStatus.textContent = 'Greška: ' + (err && err.message || 'nepoznata'); cardLabelsStatus.className = 'msg msg--error'; }
        });
    });
  }

  // ── Boot: check existing session (PKCE-aware, with loader timeout) ───────────
  (function () {
    // After 8 s on dashboard with still-active status → show "Osveži" button
    _loaderTimeout = setTimeout(function () {
      if (viewDashboard && !viewDashboard.classList.contains('hidden') &&
          dashStatus && !dashStatus.classList.contains('hidden')) {
        dashStatus.innerHTML =
          'Učitavanje traje duže.' +
          '<button onclick="location.reload()" ' +
          'style="background:none;border:1px solid #22d3ee;color:#22d3ee;' +
          'border-radius:6px;padding:2px 10px;cursor:pointer;font-size:0.9rem;margin-left:8px">' +
          'Osveži</button>';
        dashStatus.className = 'msg';
      }
    }, 8000);

    sb.auth.getSession().then(function (result) {
      var session = result.data && result.data.session;
      if (session && session.user) {
        // Session may exist in local storage but token can be invalid/expired.
        // Validate with getUser(); on 401/403 clear local session and return to login.
        sb.auth.getUser().then(function (uRes) {
          if (uRes && uRes.error) {
            console.warn('[Admin Auth] Invalid stored session', {
              message: uRes.error.message || '',
              status: uRes.error.status || null
            });
            sb.auth.signOut({ scope: 'local' }).finally(function () {
              clearTimeout(_loaderTimeout); _loaderTimeout = null;
              showView('login');
              showLoginError('Sesija je nevažeća. Prijavite se ponovo.');
            });
            return;
          }
          clearTimeout(_loaderTimeout); _loaderTimeout = null;
          enterDashboard((uRes && uRes.data && uRes.data.user) || session.user);
        }).catch(function () {
          sb.auth.signOut({ scope: 'local' }).finally(function () {
            clearTimeout(_loaderTimeout); _loaderTimeout = null;
            showView('login');
            showLoginError('Sesija je istekla. Prijavite se ponovo.');
          });
        });
        return;
      }
      // No session — check for PKCE auth code in URL (magic link / invite redirect)
      var urlCode = new URLSearchParams(window.location.search).get('code');
      if (urlCode) {
        showView('dashboard');
        showDashStatus('Prijavljujem…', 'info');
        sb.auth.exchangeCodeForSession(window.location.href).then(function (ex) {
          if (ex.data && ex.data.session && ex.data.session.user) {
            history.replaceState({}, document.title, window.location.pathname);
            clearTimeout(_loaderTimeout); _loaderTimeout = null;
            enterDashboard(ex.data.session.user);
          } else {
            clearTimeout(_loaderTimeout); _loaderTimeout = null;
            showView('login');
          }
        }).catch(function () {
          clearTimeout(_loaderTimeout); _loaderTimeout = null;
          showView('login');
        });
      } else {
        clearTimeout(_loaderTimeout); _loaderTimeout = null;
        showView('login');
      }
    });
  }());

})();
