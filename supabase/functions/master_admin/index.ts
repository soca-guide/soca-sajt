// Supabase Edge Function: master_admin
// Unified admin operations called by MASTER from /admin UI.
// Actions: invite_owner | detach_owner | delete_tenant | set_status
//
// Env vars required:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   SUPABASE_ANON_KEY
// Optional:
//   SITE_URL  (e.g. https://yourdomain.com — used as magic-link redirect)

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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  // ── Env ───────────────────────────────────────────────────────────────────────
  const supabaseUrl = Deno.env.get('SUPABASE_URL')              ?? '';
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const anonKey     = Deno.env.get('SUPABASE_ANON_KEY')         ?? '';
  const siteUrl     = (Deno.env.get('SITE_URL') ?? '').replace(/\/$/, '');

  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'Server misconfiguration: missing env vars' }, 500);
  }

  // ── Verify caller is authenticated MASTER ─────────────────────────────────────
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return json({ error: 'Unauthorized' }, 401);

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: callerProfile } = await callerClient
    .from('user_profiles').select('role').maybeSingle();

  if (!callerProfile || callerProfile.role !== 'MASTER') {
    return json({ error: 'Forbidden — MASTER only' }, 403);
  }

  // ── Parse body ────────────────────────────────────────────────────────────────
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const action      = (body.action      || '').trim();
  const tenant_id   = (body.tenant_id   || '').trim();
  const tenant_slug = (body.tenant_slug  || '').trim();
  const owner_email = (body.owner_email  || '').trim().toLowerCase();
  const status      = (body.status       || '').trim();

  // ── Service-role client ───────────────────────────────────────────────────────
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // ACTION: invite_owner
  // Find or create auth user → send magic link → upsert user_profiles → permissions
  // ═══════════════════════════════════════════════════════════════════════════════
  if (action === 'invite_owner') {
    if (!owner_email || !tenant_id) {
      return json({ error: 'Missing owner_email or tenant_id' }, 400);
    }
    if (!owner_email.includes('@')) {
      return json({ error: 'Invalid owner_email' }, 400);
    }

    // Step 1: find existing user or create invite link (without Supabase auto-email)
    let userId: string;
    let invited = false;
    let sent = false;

    const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const existing = (listData?.users ?? []).find((u) => u.email === owner_email);

    if (existing) {
      userId = existing.id;
    } else {
      const redirectTo = siteUrl ? `${siteUrl}/admin/` : undefined;
      const { data: invData, error: invErr } = await admin.auth.admin.generateLink({
        type: 'invite',
        email: owner_email,
        options: redirectTo ? { redirectTo } : undefined,
      });
      if (invErr || !invData?.user) {
        return json({ error: 'Could not create user/link: ' + (invErr?.message ?? '?') }, 500);
      }
      userId  = invData.user.id;
      invited = true;
      sent = !!((invData as { properties?: { action_link?: string } }).properties?.action_link);
    }

    // Step 2: generate magic-link for existing users (still no Supabase auto-email)
    if (existing) {
      const redirectTo = siteUrl ? `${siteUrl}/admin/` : undefined;
      const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email: owner_email,
        options: redirectTo ? { redirectTo } : undefined,
      });
      sent = !linkErr && !!((linkData as { properties?: { action_link?: string } } | null)?.properties?.action_link);
    }

    // Step 3: upsert user_profiles with email + disabled=false
    const { error: profErr1 } = await admin
      .from('user_profiles')
      .upsert(
        { user_id: userId, role: 'OWNER', tenant_id, email: owner_email, disabled: false },
        { onConflict: 'user_id' },
      );

    if (profErr1) {
      // Retry without optional columns
      await admin
        .from('user_profiles')
        .upsert(
          { user_id: userId, role: 'OWNER', tenant_id },
          { onConflict: 'user_id' },
        );
    }

    // Step 4: seed permissions (best-effort)
    const perms = [
      { tenant_id, role: 'OWNER', section_key: 'info',        item_key: 'default_config',      can_view: true, can_edit: true },
      { tenant_id, role: 'OWNER', section_key: 'parking',     item_key: 'parking_recommended', can_view: true, can_edit: true },
      { tenant_id, role: 'OWNER', section_key: 'house_rules', item_key: 'house_rules_private', can_view: true, can_edit: true },
      { tenant_id, role: 'OWNER', section_key: 'booking',     item_key: 'rebook',              can_view: true, can_edit: true },
    ];
    await admin
      .from('permissions')
      .upsert(perms, { onConflict: 'tenant_id,role,section_key,item_key', ignoreDuplicates: false })
      .catch(() => {});

    return json({ ok: true, user_id: userId, invited, sent, tenant_id, tenant_slug });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ACTION: detach_owner
  // Remove OWNER user_profiles + permissions for this tenant
  // ═══════════════════════════════════════════════════════════════════════════════
  if (action === 'detach_owner') {
    if (!tenant_id) return json({ error: 'Missing tenant_id' }, 400);

    // Delete permissions first (FK may reference user_profiles)
    try {
      await admin
        .from('permissions')
        .delete()
        .eq('tenant_id', tenant_id)
        .eq('role', 'OWNER');
    } catch (_) { /* best-effort */ }

    const { error: delErr } = await admin
      .from('user_profiles')
      .delete()
      .eq('tenant_id', tenant_id)
      .eq('role', 'OWNER');

    if (delErr) return json({ error: 'detach_owner failed: ' + delErr.message }, 500);

    return json({ ok: true });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ACTION: delete_tenant
  // Delete items → user_profiles → tenant (in correct dependency order)
  // ═══════════════════════════════════════════════════════════════════════════════
  if (action === 'delete_tenant') {
    if (!tenant_id) return json({ error: 'Missing tenant_id' }, 400);

    // 1) Items
    const { error: e1 } = await admin.from('items').delete().eq('tenant_id', tenant_id);
    if (e1) return json({ error: 'delete items failed: ' + e1.message }, 500);

    // 2) Permissions
    try {
      await admin.from('permissions').delete().eq('tenant_id', tenant_id);
    } catch (_) { /* best-effort */ }

    // 3) User profiles
    const { error: e2 } = await admin.from('user_profiles').delete().eq('tenant_id', tenant_id);
    if (e2) return json({ error: 'delete user_profiles failed: ' + e2.message }, 500);

    // 4) Tenant row
    const { error: e3 } = await admin.from('tenants').delete().eq('tenant_id', tenant_id);
    if (e3) return json({ error: 'delete tenant failed: ' + e3.message }, 500);

    return json({ ok: true });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ACTION: set_status
  // Update tenants.status + mirror user_profiles.disabled for OWNERs
  // ═══════════════════════════════════════════════════════════════════════════════
  if (action === 'set_status') {
    if (!tenant_id || !status) return json({ error: 'Missing tenant_id or status' }, 400);
    if (status !== 'active' && status !== 'inactive') {
      return json({ error: 'status must be active or inactive' }, 400);
    }

    const { error: e1 } = await admin
      .from('tenants')
      .update({ status })
      .eq('tenant_id', tenant_id);
    if (e1) return json({ error: 'update tenants failed: ' + e1.message }, 500);

    // Mirror: active -> disabled=false; inactive -> disabled=true
    await admin
      .from('user_profiles')
      .update({ disabled: status !== 'active' })
      .eq('tenant_id', tenant_id)
      .eq('role', 'OWNER')
      .catch(() => {});

    return json({ ok: true, status });
  }

  return json({ error: 'Unknown action: ' + action }, 400);
});
