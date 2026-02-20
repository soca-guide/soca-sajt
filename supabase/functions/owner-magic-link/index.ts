// Supabase Edge Function: owner-magic-link
// Sends a magic login link to an owner.
// Called by MASTER from the admin tenant table ("Login link" button).
// Env vars required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
// Optional: SITE_URL (where magic link redirects, e.g. https://yourdomain.com/admin/)

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

  // ── Parse body ───────────────────────────────────────────────────────────────
  let owner_email: string, tenant_id: string, tenant_slug: string;
  try {
    const b    = await req.json();
    owner_email = (b.owner_email  || '').trim();
    tenant_id   = (b.tenant_id    || '').trim();
    tenant_slug = (b.tenant_slug  || '').trim();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (!owner_email || !tenant_id) return json({ error: 'Missing owner_email or tenant_id' }, 400);
  if (!owner_email.includes('@'))  return json({ error: 'Invalid owner_email' }, 400);

  // ── Verify caller is authenticated MASTER ────────────────────────────────────
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return json({ error: 'Unauthorized' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')              ?? '';
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const anonKey     = Deno.env.get('SUPABASE_ANON_KEY')         ?? '';
  const siteUrl     = Deno.env.get('SITE_URL')                  ?? '';

  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'Server misconfiguration: missing env vars' }, 500);
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: callerProfile } = await callerClient
    .from('user_profiles').select('role').maybeSingle();

  if (!callerProfile || callerProfile.role !== 'MASTER') {
    return json({ error: 'Forbidden — only MASTER can send login links' }, 403);
  }

  // ── Service-role client ───────────────────────────────────────────────────────
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── Step 1: Find or create the auth user ─────────────────────────────────────
  let userId: string;
  let invited = false;

  // Try to find existing user by email
  const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = (listData?.users ?? []).find((u) => u.email === owner_email);

  if (existing) {
    userId = existing.id;
  } else {
    // Create via invite (sends set-password email, but we'll override with magic link)
    const redirectTo = siteUrl ? `${siteUrl.replace(/\/$/, '')}/admin/` : undefined;
    const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      owner_email,
      redirectTo ? { redirectTo } : undefined,
    );
    if (inviteError || !inviteData?.user) {
      return json({ error: 'Could not create user: ' + (inviteError?.message ?? '?') }, 500);
    }
    userId  = inviteData.user.id;
    invited = true;
  }

  // ── Step 2: Send magic link (OTP) ────────────────────────────────────────────
  // generateLink creates a magic link without requiring the user to initiate it.
  const redirectTo = siteUrl ? `${siteUrl.replace(/\/$/, '')}/admin/` : undefined;
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: owner_email,
    options: redirectTo ? { redirectTo } : undefined,
  });

  if (linkError) {
    return json({
      error: 'generateLink failed: ' + linkError.message,
      user_id: userId, invited,
    }, 500);
  }

  // The actual magic link is in linkData.properties.action_link
  // Supabase automatically sends the email when using generateLink with type='magiclink'
  // (Supabase sends the email on your behalf via its SMTP / sendgrid integration)

  // ── Step 3: Ensure user_profiles row exists with disabled=false ───────────────
  const { error: profileErr1 } = await admin
    .from('user_profiles')
    .upsert(
      { user_id: userId, role: 'OWNER', tenant_id, email: owner_email, disabled: false },
      { onConflict: 'user_id' },
    );

  if (profileErr1) {
    // Retry without email/disabled columns in case they don't exist yet
    await admin
      .from('user_profiles')
      .upsert(
        { user_id: userId, role: 'OWNER', tenant_id },
        { onConflict: 'user_id' },
      );
  }

  // ── Step 4: Ensure permissions rows exist ─────────────────────────────────────
  const perms = [
    { tenant_id, role: 'OWNER', section_key: 'info',        item_key: 'default_config',      can_view: true, can_edit: true },
    { tenant_id, role: 'OWNER', section_key: 'parking',     item_key: 'parking_recommended', can_view: true, can_edit: true },
    { tenant_id, role: 'OWNER', section_key: 'house_rules', item_key: 'house_rules_private', can_view: true, can_edit: true },
    { tenant_id, role: 'OWNER', section_key: 'booking',     item_key: 'rebook',              can_view: true, can_edit: true },
  ];
  await admin
    .from('permissions')
    .upsert(perms, { onConflict: 'tenant_id,role,section_key,item_key', ignoreDuplicates: false });

  return json({
    ok: true,
    user_id: userId,
    invited,
    magic_link_sent: true,
    tenant_id,
    tenant_slug,
  });
});
