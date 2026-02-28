// Supabase Edge Function: send-owner-invite
// Kreira korisnika u Supabase Auth pomoću generateLink (BEZ slanja Supabase email-a),
// upsertuje user_profiles + permissions, i šalje JEDAN profesionalni email vlasnika putem Resend.
//
// Env vars (Supabase Dashboard → Settings → Edge Functions → Secrets):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
//   RESEND_API_KEY, FROM_EMAIL, FROM_NAME, ADMIN_URL, SITE_URL

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// ── Email templates ────────────────────────────────────────────────────────────

function buildEmailSl(p: {
  tenant_name: string; action_link: string;
  admin_url: string; manage_url: string; guest_url: string;
}) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif">
<div style="max-width:600px;margin:32px auto;background:#0d1f1a;border-radius:16px;overflow:hidden;border:1px solid rgba(34,211,238,0.2)">
  <div style="padding:32px 28px 20px">
    <h1 style="color:#22d3ee;margin:0 0 12px;font-size:1.4rem">Dobrodošli!</h1>
    <p style="color:#a7f3d0;margin:0 0 24px;font-size:0.95rem;line-height:1.6">
      Spodaj so vaše povezave za dostop do admin panela in upravljanje apartmaja
      <strong style="color:#fff">&ldquo;${p.tenant_name}&rdquo;</strong>.
    </p>
    <div style="text-align:center;margin:0 0 28px">
      <a href="${p.action_link}"
        style="display:inline-block;background:#22d3ee;color:#0a1612;font-weight:700;font-size:1rem;padding:14px 36px;border-radius:10px;text-decoration:none">
        Prijava v admin panel
      </a>
    </div>
  </div>
  <div style="padding:0 28px 24px">
    <div style="background:rgba(255,255,255,0.05);border-radius:10px;padding:16px;margin-bottom:12px">
      <p style="color:#9ca3af;font-size:0.75rem;margin:0 0 8px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase">Povezave</p>
      <p style="margin:0 0 6px;font-size:0.85rem;color:#e5e7eb">
        🔧 Admin panel: <a href="${p.admin_url}" style="color:#22d3ee">${p.admin_url}</a>
      </p>
      <p style="margin:0 0 6px;font-size:0.85rem;color:#e5e7eb">
        🏠 Urejanje apartmaja: <a href="${p.manage_url}" style="color:#22d3ee">${p.manage_url}</a>
      </p>
      <p style="margin:0;font-size:0.85rem;color:#e5e7eb">
        🔗 Stran za goste: <a href="${p.guest_url}" style="color:#22d3ee">${p.guest_url}</a>
      </p>
    </div>
    <p style="font-size:0.78rem;color:#6b7280;margin:12px 0 0;line-height:1.6">
      Če gumb ne deluje, odprite to povezavo:<br>
      <a href="${p.action_link}" style="color:#22d3ee;word-break:break-all">${p.action_link}</a>
    </p>
  </div>
  <div style="border-top:1px solid rgba(255,255,255,0.08);padding:16px 28px;text-align:center">
    <p style="color:#4b5563;font-size:0.75rem;margin:0">Revantora</p>
  </div>
</div>
</body></html>`;
}

function buildEmailEn(p: {
  tenant_name: string; action_link: string;
  admin_url: string; manage_url: string; guest_url: string;
}) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif">
<div style="max-width:600px;margin:32px auto;background:#0d1f1a;border-radius:16px;overflow:hidden;border:1px solid rgba(34,211,238,0.2)">
  <div style="padding:32px 28px 20px">
    <h1 style="color:#22d3ee;margin:0 0 12px;font-size:1.4rem">Welcome!</h1>
    <p style="color:#a7f3d0;margin:0 0 24px;font-size:0.95rem;line-height:1.6">
      Below are your links to access the admin panel and manage your apartment
      <strong style="color:#fff">&ldquo;${p.tenant_name}&rdquo;</strong>.
    </p>
    <div style="text-align:center;margin:0 0 28px">
      <a href="${p.action_link}"
        style="display:inline-block;background:#22d3ee;color:#0a1612;font-weight:700;font-size:1rem;padding:14px 36px;border-radius:10px;text-decoration:none">
        Sign in to admin panel
      </a>
    </div>
  </div>
  <div style="padding:0 28px 24px">
    <div style="background:rgba(255,255,255,0.05);border-radius:10px;padding:16px;margin-bottom:12px">
      <p style="color:#9ca3af;font-size:0.75rem;margin:0 0 8px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase">Links</p>
      <p style="margin:0 0 6px;font-size:0.85rem;color:#e5e7eb">
        🔧 Admin panel: <a href="${p.admin_url}" style="color:#22d3ee">${p.admin_url}</a>
      </p>
      <p style="margin:0 0 6px;font-size:0.85rem;color:#e5e7eb">
        🏠 Manage your apartment: <a href="${p.manage_url}" style="color:#22d3ee">${p.manage_url}</a>
      </p>
      <p style="margin:0;font-size:0.85rem;color:#e5e7eb">
        🔗 Guest page: <a href="${p.guest_url}" style="color:#22d3ee">${p.guest_url}</a>
      </p>
    </div>
    <p style="font-size:0.78rem;color:#6b7280;margin:12px 0 0;line-height:1.6">
      If the button doesn&rsquo;t work, open this link:<br>
      <a href="${p.action_link}" style="color:#22d3ee;word-break:break-all">${p.action_link}</a>
    </p>
  </div>
  <div style="border-top:1px solid rgba(255,255,255,0.08);padding:16px 28px;text-align:center">
    <p style="color:#4b5563;font-size:0.75rem;margin:0">Revantora</p>
  </div>
</div>
</body></html>`;
}

// ── Main handler ───────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);

  // ── Auth header required ────────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization') ?? '';
  if (!authHeader) return json({ ok: false, error: 'Unauthorized' }, 401);

  // ── Env vars ────────────────────────────────────────────────────────────────
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const anonKey     = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const resendKey   = Deno.env.get('RESEND_API_KEY') ?? '';
  const fromName    = Deno.env.get('FROM_NAME')  ?? 'Revantora';
  const fromEmail   = Deno.env.get('FROM_EMAIL') ?? 'noreply@revantora.com';
  const adminUrlEnv = (Deno.env.get('ADMIN_URL') ?? 'https://revantora.com/admin').replace(/\/$/, '');
  const siteUrlEnv  = (Deno.env.get('SITE_URL')  ?? 'https://revantora.com').replace(/\/$/, '');

  if (!supabaseUrl || !serviceKey) return json({ ok: false, error: 'Server misconfiguration' }, 500);
  if (!resendKey) return json({ ok: false, error: 'Missing RESEND_API_KEY' }, 500);

  // ── Parse body ──────────────────────────────────────────────────────────────
  let tenant_id: string, tenant_slug: string, tenant_name: string, owner_email: string;
  let locale: string, admin_url: string, site_url: string;
  try {
    const body  = await req.json();
    tenant_id   = (body.tenant_id   || '').trim();
    tenant_slug = (body.tenant_slug || '').trim();
    tenant_name = (body.tenant_name || '').trim();
    owner_email = (body.owner_email || '').trim().toLowerCase();
    locale      = (body.locale      || 'sl').trim();
    admin_url   = (body.admin_url   || adminUrlEnv).replace(/\/$/, '');
    site_url    = (body.site_url    || siteUrlEnv).replace(/\/$/, '');
  } catch {
    return json({ ok: false, error: 'Invalid JSON body' }, 400);
  }

  if (!owner_email || !owner_email.includes('@')) return json({ ok: false, error: 'Invalid owner_email' }, 400);
  if (!tenant_id)                                  return json({ ok: false, error: 'Missing tenant_id' }, 400);

  // ── Verify caller is MASTER ─────────────────────────────────────────────────
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: callerUser } = await callerClient.auth.getUser();
  const callerId = callerUser?.user?.id ?? '';
  if (!callerId) return json({ ok: false, error: 'Unauthorized' }, 401);

  const { data: callerProfile } = await callerClient
    .from('user_profiles')
    .select('role')
    .eq('user_id', callerId)
    .maybeSingle();
  if (!callerProfile || callerProfile.role !== 'MASTER') {
    return json({ ok: false, error: 'Forbidden — only MASTER can invite owners' }, 403);
  }

  // ── Service-role client ─────────────────────────────────────────────────────
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── Step 1: generateLink (type "invite") — creates user WITHOUT Supabase email ──
  let userId      = '';
  let action_link = '';

  const { data: inviteData, error: inviteErr } = await admin.auth.admin.generateLink({
    type: 'invite',
    email: owner_email,
    options: { redirectTo: admin_url },
  });

  if (!inviteErr && inviteData?.user) {
    userId      = inviteData.user.id;
    // Supabase v2: action_link lives in properties
    const props = (inviteData as { properties?: { action_link?: string } }).properties ?? {};
    action_link = props.action_link ?? '';
  } else {
    // User already exists — find them and generate a magiclink instead
    const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const existing = (listData?.users ?? []).find((u) => u.email === owner_email);
    if (!existing) {
      return json({
        ok: false,
        error: 'Failed to create/find user: ' + (inviteErr?.message ?? 'unknown'),
      }, 500);
    }
    userId = existing.id;
    const { data: mlData } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: owner_email,
      options: { redirectTo: admin_url },
    });
    const mlProps = (mlData as { properties?: { action_link?: string } } | null)?.properties ?? {};
    action_link = mlProps.action_link ?? '';
  }

  if (!userId) return json({ ok: false, error: 'Could not determine user ID' }, 500);

  // ── Step 2: Upsert pending_owner_invites ────────────────────────────────────
  await admin
    .from('pending_owner_invites')
    .upsert({ email: owner_email, tenant_id }, { onConflict: 'email' });

  // ── Step 3: Upsert user_profiles ────────────────────────────────────────────
  const { error: profErr } = await admin
    .from('user_profiles')
    .upsert(
      { user_id: userId, role: 'OWNER', tenant_id, email: owner_email },
      { onConflict: 'user_id' },
    );
  if (profErr) {
    // Retry without email column in case it doesn't exist
    await admin
      .from('user_profiles')
      .upsert({ user_id: userId, role: 'OWNER', tenant_id }, { onConflict: 'user_id' });
  }

  // ── Step 4: Seed permissions ────────────────────────────────────────────────
  const perms = [
    { tenant_id, role: 'OWNER', section_key: 'info',        item_key: 'default_config',      can_view: true, can_edit: true },
    { tenant_id, role: 'OWNER', section_key: 'parking',     item_key: 'parking_recommended', can_view: true, can_edit: true },
    { tenant_id, role: 'OWNER', section_key: 'house_rules', item_key: 'house_rules_private', can_view: true, can_edit: true },
    { tenant_id, role: 'OWNER', section_key: 'booking',     item_key: 'rebook',              can_view: true, can_edit: true },
  ];
  await admin
    .from('permissions')
    .upsert(perms, { onConflict: 'tenant_id,role,section_key,item_key', ignoreDuplicates: false });

  // ── Step 5: Build and send ONE email via Resend ─────────────────────────────
  const manage_url = tenant_slug ? `${admin_url}?tenant=${tenant_slug}` : admin_url;
  const guest_url  = tenant_slug ? `${site_url}/t/${tenant_slug}` : site_url;

  const subject = locale === 'sl'
    ? `Dostop do admin panela \u2013 ${tenant_name}`
    : `Invitation to access the admin panel \u2013 ${tenant_name}`;

  const html = locale === 'sl'
    ? buildEmailSl({ tenant_name, action_link, admin_url, manage_url, guest_url })
    : buildEmailEn({ tenant_name, action_link, admin_url, manage_url, guest_url });

  const fromAddr = `${fromName} <${fromEmail}>`;

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: fromAddr, to: [owner_email], subject, html }),
  });

  if (!resendRes.ok) {
    const errText = await resendRes.text();
    console.error('[send-owner-invite] Resend error:', errText);
    // User was created and linked — return partial success so UI can continue
    return json({ ok: true, email_sent: false, email_error: errText });
  }

  const resendJson = await resendRes.json();
  console.log('[send-owner-invite] Email sent, id:', resendJson.id);

  return json({ ok: true, email_sent: true });
});
