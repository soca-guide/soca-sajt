// Supabase Edge Function: invite-owner
// Deployed at: /functions/v1/invite-owner
// Called by MASTER admin to invite an owner and link them to a tenant.
// Requires env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
// Optional env var: SITE_URL (for the invite redirect link, e.g. https://yourdomain.com)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  // ── Parse body ───────────────────────────────────────────────────────────────
  let owner_email: string, tenant_id: string, tenant_slug: string;
  try {
    const body = await req.json();
    owner_email = (body.owner_email || '').trim();
    tenant_id   = (body.tenant_id   || '').trim();
    tenant_slug = (body.tenant_slug  || '').trim();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (!owner_email || !tenant_id) {
    return json({ error: 'Missing owner_email or tenant_id' }, 400);
  }
  if (!owner_email.includes('@')) {
    return json({ error: 'Invalid owner_email' }, 400);
  }

  // ── Verify caller is authenticated ───────────────────────────────────────────
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return json({ error: 'Unauthorized — no auth header' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const anonKey     = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const siteUrl     = Deno.env.get('SITE_URL') ?? '';

  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'Server misconfiguration: missing env vars' }, 500);
  }

  // Verify caller is MASTER using their session JWT
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: callerProfile, error: profileReadError } = await callerClient
    .from('user_profiles')
    .select('role')
    .maybeSingle();

  if (profileReadError || !callerProfile || callerProfile.role !== 'MASTER') {
    return json({ error: 'Forbidden — only MASTER can invite owners' }, 403);
  }

  // ── Service-role client for privileged operations ────────────────────────────
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── Step 1: Invite or find existing auth user ─────────────────────────────────
  let userId: string;
  let invited = false;

  const redirectTo = siteUrl ? `${siteUrl}/admin/` : undefined;
  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    owner_email,
    redirectTo ? { redirectTo } : undefined,
  );

  if (inviteError) {
    // User may already exist — find them in the users list
    const { data: listData, error: listError } = await admin.auth.admin.listUsers({
      perPage: 1000,
    });
    if (listError) {
      return json({ error: 'Invite failed and could not list users: ' + inviteError.message }, 500);
    }
    const existing = (listData?.users ?? []).find((u) => u.email === owner_email);
    if (!existing) {
      return json({ error: 'Invite failed: ' + inviteError.message }, 500);
    }
    userId = existing.id;
  } else {
    userId  = inviteData.user.id;
    invited = true;
  }

  // ── Step 2: Upsert user_profiles ─────────────────────────────────────────────
  // Try with email column first; fall back silently if column doesn't exist
  const { error: profileErr1 } = await admin
    .from('user_profiles')
    .upsert(
      { user_id: userId, role: 'OWNER', tenant_id, email: owner_email },
      { onConflict: 'user_id' },
    );

  if (profileErr1) {
    // Retry without email column
    const { error: profileErr2 } = await admin
      .from('user_profiles')
      .upsert(
        { user_id: userId, role: 'OWNER', tenant_id },
        { onConflict: 'user_id' },
      );
    if (profileErr2) {
      return json({
        error: 'user_profiles upsert failed: ' + profileErr2.message,
        user_id: userId, invited,
      }, 500);
    }
  }

  // ── Step 3: Seed permissions ──────────────────────────────────────────────────
  const perms = [
    { tenant_id, role: 'OWNER', section_key: 'info',        item_key: 'default_config',      can_view: true, can_edit: true },
    { tenant_id, role: 'OWNER', section_key: 'parking',     item_key: 'parking_recommended', can_view: true, can_edit: true },
    { tenant_id, role: 'OWNER', section_key: 'house_rules', item_key: 'house_rules_private', can_view: true, can_edit: true },
    { tenant_id, role: 'OWNER', section_key: 'booking',     item_key: 'rebook',              can_view: true, can_edit: true },
  ];

  const { error: permsError } = await admin
    .from('permissions')
    .upsert(perms, { onConflict: 'tenant_id,role,section_key,item_key', ignoreDuplicates: false });

  if (permsError) {
    // Non-fatal: profile was already linked; log and continue
    console.warn('[invite-owner] permissions upsert warning:', permsError.message);
  }

  return json({
    ok:         true,
    user_id:    userId,
    invited,                 // true = new invite sent; false = existing user, profile updated
    tenant_id,
    tenant_slug,
  });
});
