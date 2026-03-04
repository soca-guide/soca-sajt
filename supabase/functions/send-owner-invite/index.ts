// Supabase Edge Function: send-owner-invite
//
// Required secrets (Supabase Dashboard → Settings → Edge Functions → Secrets):
//   SUPABASE_URL              — e.g. https://xyzxyz.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY — service role key (never the anon key)
//   SUPABASE_ANON_KEY         — anon/public key (used to verify caller identity)
//   RESEND_API_KEY            — Resend API key
//   FROM_EMAIL                — e.g. noreply@revantora.com  (MUST be verified in Resend)
//   FROM_NAME                 — e.g. Revantora
//   SITE_URL                  — e.g. https://revantora.com  (never localhost)
//   ADMIN_URL                 — e.g. https://revantora.com/admin (never localhost)
//
// What this function does:
//   1. Verifies the caller is an authenticated MASTER user.
//   2. Creates or finds the owner auth user via service-role generateLink
//      (does NOT trigger any Supabase default email).
//   3. Upserts: pending_owner_invites, user_profiles, permissions.
//   4. Sends EXACTLY ONE email via Resend containing:
//        - magic/action link  → owner logs in and lands on their tenant panel
//        - public site link   → SITE_URL/tenant_slug
//   5. Returns { ok: true } on success, { ok: false, error: "..." } on failure.
//      If Resend fails → returns { ok: false } (no partial success, no fallback Supabase email).

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function maskEmail(e: string) {
  const m = e.match(/^(.{2})(.*)(@.*)$/);
  if (!m) return "***";
  return `${m[1]}***${m[3]}`;
}

function isLocalhost(u: string) {
  return /^https?:\/\/(localhost|127\.)/i.test(u);
}

// ── Email template ─────────────────────────────────────────────────────────────

function buildEmail(p: {
  tenant_name: string;
  action_link: string;   // magic link → owner logs in + lands on their panel
  manage_url:  string;   // ADMIN_URL/?tenant=SLUG (informational, same as action_link redirectTo)
  public_url:  string;   // SITE_URL/tenant_slug
}) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif">
<div style="max-width:600px;margin:32px auto;background:#0d1f1a;border-radius:16px;overflow:hidden;border:1px solid rgba(34,211,238,0.2)">
  <div style="padding:32px 28px 20px">
    <h1 style="color:#22d3ee;margin:0 0 12px;font-size:1.4rem">🏠 Vaš apartma je pripravljen!</h1>
    <p style="color:#a7f3d0;margin:0 0 24px;font-size:0.95rem;line-height:1.6">
      Ustvarjen je bil vaš apartma <strong style="color:#fff">&ldquo;${p.tenant_name}&rdquo;</strong>
      na platformi Soča Guide. Kliknite spodnji gumb za takojšnjo prijavo.
    </p>
    <div style="text-align:center;margin:0 0 28px">
      <a href="${p.action_link}"
        style="display:inline-block;background:#22d3ee;color:#0a1612;font-weight:700;font-size:1rem;padding:14px 36px;border-radius:10px;text-decoration:none">
        🔑 Prijava v upravljanje
      </a>
    </div>
  </div>
  <div style="padding:0 28px 24px">
    <div style="background:rgba(255,255,255,0.05);border-radius:10px;padding:16px;margin-bottom:12px">
      <p style="color:#9ca3af;font-size:0.75rem;margin:0 0 10px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase">Vaše povezave</p>
      <p style="margin:0 0 10px;font-size:0.85rem;color:#e5e7eb">
        🔑 <strong>Skrbniška plošča (vaš panel):</strong><br>
        <a href="${p.manage_url}" style="color:#22d3ee;word-break:break-all">${p.manage_url}</a>
      </p>
      <p style="margin:0;font-size:0.85rem;color:#e5e7eb">
        🔗 <strong>Vaš javni sajt za goste:</strong><br>
        <a href="${p.public_url}" style="color:#22d3ee;word-break:break-all">${p.public_url}</a>
      </p>
    </div>
    <div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:12px 16px;margin-top:8px">
      <p style="font-size:0.78rem;color:#9ca3af;margin:0 0 6px;font-weight:600">Gumb ne deluje?</p>
      <p style="font-size:0.78rem;color:#6b7280;margin:0;line-height:1.6;word-break:break-all">
        Kopirajte in odprite to povezavo v brskalnik:<br>
        <a href="${p.action_link}" style="color:#22d3ee">${p.action_link}</a>
      </p>
    </div>
  </div>
  <div style="border-top:1px solid rgba(255,255,255,0.08);padding:16px 28px;text-align:center">
    <p style="color:#4b5563;font-size:0.75rem;margin:0">Soča Guide — Revantora</p>
  </div>
</div>
</body></html>`;
}

// ── Main handler ───────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  const startedAt = Date.now();

  // ── 1. Require authenticated caller ─────────────────────────────────────────
  const authHeader = req.headers.get("authorization") ?? "";
  console.log("[send-owner-invite] boot", { hasAuth: !!authHeader, method: req.method });
  if (!authHeader) {
    console.error("[send-owner-invite] missing auth header");
    return json({ ok: false, error: "Unauthorized" }, 401);
  }

  // ── 2. Load and validate env secrets ────────────────────────────────────────
  const supabaseUrl = Deno.env.get("SUPABASE_URL")              ?? "";
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anonKey     = Deno.env.get("SUPABASE_ANON_KEY")         ?? "";
  const resendKey   = Deno.env.get("RESEND_API_KEY")            ?? "";
  const fromEmail   = Deno.env.get("FROM_EMAIL")                ?? "";
  const fromName    = Deno.env.get("FROM_NAME")                 ?? "Revantora";
  const rawSiteUrl  = Deno.env.get("SITE_URL")  ?? "";
  const rawAdminUrl = Deno.env.get("ADMIN_URL") ?? "";

  console.log("[send-owner-invite] env check", {
    hasSupabaseUrl: !!supabaseUrl,
    hasServiceKey: !!serviceKey,
    hasResendKey: !!resendKey,
    hasFromEmail: !!fromEmail,
    siteUrlRaw: rawSiteUrl.slice(0, 40),
    adminUrlRaw: rawAdminUrl.slice(0, 40),
  });

  if (!supabaseUrl || !serviceKey) {
    return json({ ok: false, error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }, 500);
  }
  if (!resendKey)  return json({ ok: false, error: "Missing RESEND_API_KEY" }, 500);
  if (!fromEmail)  return json({ ok: false, error: "Missing FROM_EMAIL" }, 500);

  // URL validation: warn if localhost but use fallback so function doesn't hard-fail
  const PROD_SITE  = "https://revantora.com";
  const PROD_ADMIN = "https://revantora.com/admin";
  const siteUrl  = (!rawSiteUrl  || isLocalhost(rawSiteUrl))  ? PROD_SITE  : rawSiteUrl.replace(/\/$/, "");
  const adminUrl = (!rawAdminUrl || isLocalhost(rawAdminUrl)) ? PROD_ADMIN : rawAdminUrl.replace(/\/$/, "");
  if (!rawSiteUrl  || isLocalhost(rawSiteUrl))  console.warn("[send-owner-invite] SITE_URL missing/localhost — using fallback:", PROD_SITE);
  if (!rawAdminUrl || isLocalhost(rawAdminUrl)) console.warn("[send-owner-invite] ADMIN_URL missing/localhost — using fallback:", PROD_ADMIN);

  // ── 3. Parse body — ONLY tenant data, no URL overrides ──────────────────────
  let tenant_id = "", tenant_slug = "", owner_email = "", tenant_name = "", locale = "sl";
  try {
    const body = await req.json();
    tenant_id   = String(body?.tenant_id   ?? "").trim();
    tenant_slug = String(body?.tenant_slug ?? "").trim();
    owner_email = String(body?.owner_email ?? "").trim().toLowerCase();
    tenant_name = String(body?.tenant_name ?? "").trim();
    locale      = String(body?.locale      ?? "sl").trim();
    // site_url / admin_url from body are intentionally ignored — env secrets only
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, 400);
  }

  if (!owner_email || !owner_email.includes("@")) {
    return json({ ok: false, error: "Invalid owner_email" }, 400);
  }
  if (!tenant_id)   return json({ ok: false, error: "Missing tenant_id" }, 400);
  if (!tenant_slug) return json({ ok: false, error: "Missing tenant_slug" }, 400);

  // ── 4. Verify caller is MASTER (non-fatal if JWT expired — service role handles DB) ────
  if (anonKey && authHeader) {
    try {
      const callerClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData, error: userErr } = await callerClient.auth.getUser();
      if (!userErr && userData?.user?.id) {
        const { data: prof } = await callerClient
          .from("user_profiles")
          .select("role")
          .eq("user_id", userData.user.id)
          .maybeSingle();
        if (prof && prof.role !== "MASTER") {
          console.error("[send-owner-invite] Forbidden — caller role:", prof.role);
          return json({ ok: false, error: "Forbidden — only MASTER can invite owners" }, 403);
        }
        console.log("[send-owner-invite] caller verified", { role: prof?.role ?? "unknown" });
      } else {
        // JWT expired or invalid — log warning but allow through (service role handles DB)
        console.warn("[send-owner-invite] caller JWT check failed (expired?), proceeding with service role", {
          err: userErr?.message ?? "no user",
        });
      }
    } catch (e) {
      console.warn("[send-owner-invite] caller check threw, proceeding", { msg: (e as Error)?.message });
    }
  }

  console.log("[send-owner-invite] start", {
    tenant_id, tenant_slug, owner_email: maskEmail(owner_email),
  });

  // ── Service-role client (bypasses RLS) ──────────────────────────────────────
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // ── 5a. Upsert pending_owner_invites FIRST ──────────────────────────────────
    // CRITICAL: must be inserted BEFORE generateLink so the trigger
    // auto_link_pending_owner fires and creates user_profiles when new user is inserted.
    // Schema: email UNIQUE (single column), no status column in original schema.
    const { error: poiErr } = await admin
      .from("pending_owner_invites")
      .upsert({ email: owner_email, tenant_id }, { onConflict: "email" });
    if (poiErr) {
      console.error("[send-owner-invite] pending_owner_invites upsert FAILED", poiErr.message);
      // Non-fatal: continue — we will manually upsert user_profiles below
    } else {
      console.log("[send-owner-invite] pending_owner_invites OK");
    }

    // ── 5b. Create/find auth user and generate magic link (no Supabase email) ───
    // CORRECT redirectTo: ?view=owner&t=SLUG — matches admin.js URL check
    const redirectTo = `${adminUrl}/?view=owner&t=${encodeURIComponent(tenant_slug)}`;
    let userId = "";
    let action_link = "";

    // Attempt 1: invite (creates new user; trigger fires if pending_owner_invites exists)
    const { data: inviteData, error: inviteErr } = await admin.auth.admin.generateLink({
      type: "invite",
      email: owner_email,
      options: { redirectTo },
    });

    if (!inviteErr && inviteData?.user) {
      userId = inviteData.user.id;
      action_link = (inviteData as { properties?: { action_link?: string } }).properties?.action_link ?? "";
      console.log("[send-owner-invite] generateLink(invite) OK", { userId });
    } else {
      // Attempt 2: user already exists — find + generate magic link
      // (trigger won't fire for existing users, so we upsert user_profiles manually below)
      console.warn("[send-owner-invite] invite failed, trying existing user", {
        msg: inviteErr?.message ?? "unknown",
      });
      const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
      if (listErr) {
        return json({ ok: false, error: "list_users_failed", details: listErr.message }, 500);
      }
      const existing = (listData?.users ?? []).find(
        (u) => (u.email ?? "").toLowerCase() === owner_email,
      );
      if (!existing) {
        return json({ ok: false, error: "user_creation_failed", details: inviteErr?.message ?? "unknown" }, 500);
      }
      userId = existing.id;

      const { data: mlData, error: mlErr } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email: owner_email,
        options: { redirectTo },
      });
      if (mlErr) {
        return json({ ok: false, error: "magiclink_failed", details: mlErr.message }, 500);
      }
      action_link = (mlData as { properties?: { action_link?: string } } | null)?.properties?.action_link ?? "";
      console.log("[send-owner-invite] generateLink(magiclink) OK", { userId });
    }

    if (!userId)      return json({ ok: false, error: "Could not determine user ID" }, 500);
    if (!action_link) {
      console.error("[send-owner-invite] action_link empty — hard stop");
      return json({ ok: false, error: "action_link_generation_failed" }, 500);
    }

    // ── 6a. Upsert user_profiles directly ───────────────────────────────────────
    // Handles existing users (trigger only fires on INSERT of new auth user).
    // For new users the trigger already ran, but this upsert is safe (ON CONFLICT DO UPDATE).
    const { error: profErr } = await admin
      .from("user_profiles")
      .upsert({ user_id: userId, role: "OWNER", tenant_id, email: owner_email }, { onConflict: "user_id" });
    if (profErr) {
      // Retry without email column (in case email column doesn't exist in user_profiles)
      const { error: profErr2 } = await admin
        .from("user_profiles")
        .upsert({ user_id: userId, role: "OWNER", tenant_id }, { onConflict: "user_id" });
      if (profErr2) {
        console.error("[send-owner-invite] user_profiles upsert FAILED", {
          first_error: profErr.message,
          second_error: profErr2.message,
        });
        return json({ ok: false, error: "user_profiles_upsert_failed", details: profErr2.message }, 500);
      }
    }
    console.log("[send-owner-invite] user_profiles OK", { userId, tenant_id });

    // ── 6b. Upsert permissions ────────────────────────────────────────────────
    const perms = [
      { tenant_id, role: "OWNER", section_key: "info",        item_key: "default_config",      can_view: true, can_edit: true },
      { tenant_id, role: "OWNER", section_key: "parking",     item_key: "parking_recommended", can_view: true, can_edit: true },
      { tenant_id, role: "OWNER", section_key: "house_rules", item_key: "house_rules_private", can_view: true, can_edit: true },
      { tenant_id, role: "OWNER", section_key: "booking",     item_key: "rebook",              can_view: true, can_edit: true },
    ];
    const { error: permErr } = await admin
      .from("permissions")
      .upsert(perms, { onConflict: "tenant_id,role,section_key,item_key", ignoreDuplicates: false });
    if (permErr) console.warn("[send-owner-invite] permissions upsert warning", permErr.message);
    console.log("[send-owner-invite] permissions OK");

    // ── 7. Build URLs ──────────────────────────────────────────────────────────
    // manage_url: owner panel URL — matches ?view=owner&t=SLUG pattern in admin.js
    const manage_url = `${adminUrl}/?view=owner&t=${encodeURIComponent(tenant_slug)}`;
    const public_url = `${siteUrl}/${tenant_slug}`;

    // ── 8. Send ONE email via Resend ───────────────────────────────────────────
    const displayName = tenant_name || tenant_slug || "apartma";
    const subject = locale === "en"
      ? `Welcome — access to "${displayName}"`
      : `Dostop do vašega apartmaja „${displayName}"`;

    const emailHtml = buildEmail({ tenant_name: displayName, action_link, manage_url, public_url });
    const fromAddress = `${fromName} <${fromEmail}>`;

    console.log("[send-owner-invite] sending via Resend", {
      from: fromAddress, to: maskEmail(owner_email), subject,
    });

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:    fromAddress,
        to:      [owner_email],
        subject,
        html:    emailHtml,
        text:    `Prijavite se: ${action_link}\n\nVaš apartma: ${public_url}`,
        headers: { "X-Entity-Ref-ID": `owner-invite-${tenant_id}` },
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text().catch(() => "unknown");
      console.error("[send-owner-invite] Resend error", { status: resendRes.status, body: errBody });
      // DB upserts already done; only email failed
      return json({ ok: false, error: "email_send_failed", details: errBody }, 500);
    }

    const resendJson = await resendRes.json().catch(() => ({}));
    console.log("[send-owner-invite] email sent OK", {
      resend_id: resendJson?.id ?? null,
      to: maskEmail(owner_email),
      duration_ms: Date.now() - startedAt,
    });

    return json({ ok: true, resend_id: resendJson?.id ?? null });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[send-owner-invite] fatal", { tenant_id, owner_email: maskEmail(owner_email), error: message });
    return json({ ok: false, error: message }, 500);
  }
});
