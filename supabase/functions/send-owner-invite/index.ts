// Supabase Edge Function: send-owner-invite
// Kreira korisnika u Supabase Auth pomoću generateLink (BEZ slanja Supabase email-a),
// upsertuje user_profiles + permissions, i šalje JEDAN profesionalni email vlasniku putem Resend.
//
// Env vars (Supabase Dashboard → Settings → Edge Functions → Secrets):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
//   RESEND_API_KEY
//   RESEND_FROM (preporučeno) ili FROM_EMAIL
//   FROM_NAME (opciono)
//   ADMIN_URL (opciono), SITE_URL (opciono)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// ── Email templates ────────────────────────────────────────────────────────────

function buildEmailSl(p: {
  tenant_name: string;
  action_link: string;
  admin_url: string;
  manage_url: string;
  guest_url: string;
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
  tenant_name: string;
  action_link: string;
  admin_url: string;
  manage_url: string;
  guest_url: string;
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

function maskEmail(e: string) {
  const m = e.match(/^(.{2})(.*)(@.*)$/);
  if (!m) return "***";
  return `${m[1]}***${m[3]}`;
}

// ── Helper: robust upsert pending_owner_invites without knowing unique keys ───

async function upsertPendingInvite(
  admin: ReturnType<typeof createClient>,
  owner_email: string,
  tenant_id: string,
) {
  // Try common unique constraints; if they fail, fallback to "select then insert".
  const attempts = [
    { onConflict: "tenant_id,email" },
    { onConflict: "email" },
    { onConflict: "tenant_id" },
  ];

  for (const a of attempts) {
    const { error } = await admin
      .from("pending_owner_invites")
      .upsert({ email: owner_email, tenant_id }, { onConflict: a.onConflict as any });

    if (!error) return { ok: true as const, mode: `upsert(${a.onConflict})` };
    // If ON CONFLICT doesn't match constraint, try next
    const msg = (error as any)?.message ?? "";
    if (msg.includes("no unique or exclusion constraint")) continue;

    // Other real errors: stop
    return { ok: false as const, error: msg || "pending_owner_invites_upsert_failed" };
  }

  // Fallback: check existing row by (tenant_id,email) if those columns exist; if not, just insert and ignore errors
  // We'll do a simple insert and if duplicate happens we accept it as OK.
  const { error: insErr } = await admin
    .from("pending_owner_invites")
    .insert({ email: owner_email, tenant_id });

  if (!insErr) return { ok: true as const, mode: "insert" };

  const insMsg = (insErr as any)?.message ?? "";
  // Duplicate key -> treat as ok
  if (
    insMsg.toLowerCase().includes("duplicate") ||
    insMsg.toLowerCase().includes("already exists")
  ) {
    return { ok: true as const, mode: "insert-dup-ok" };
  }
  return { ok: false as const, error: insMsg || "pending_owner_invites_insert_failed" };
}

// ── Main handler ───────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  const startedAt = Date.now();

  // ── Auth header required ────────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader) return json({ ok: false, error: "Unauthorized" }, 401);

  // ── Env vars ────────────────────────────────────────────────────────────────
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
  const fromName = Deno.env.get("FROM_NAME") ?? "Revantora";
  const fromEmail = Deno.env.get("RESEND_FROM") ?? Deno.env.get("FROM_EMAIL") ?? "noreply@revantora.com";
  const adminUrlEnv = (Deno.env.get("ADMIN_URL") ?? "https://revantora.com/admin").replace(/\/$/, "");
  const siteUrlEnv = (Deno.env.get("SITE_URL") ?? "https://revantora.com").replace(/\/$/, "");

  if (!supabaseUrl || !serviceKey || !anonKey) {
    console.error("[send-owner-invite] misconfig", {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!serviceKey,
      hasAnonKey: !!anonKey,
    });
    return json({ ok: false, error: "Server misconfiguration (missing SUPABASE_URL/KEYS)" }, 500);
  }
  if (!resendKey) return json({ ok: false, error: "Missing RESEND_API_KEY" }, 500);

  // ── Parse body ──────────────────────────────────────────────────────────────
  let tenant_id = "";
  let tenant_slug = "";
  let tenant_name = "";
  let owner_email = "";
  let locale = "sl";
  let admin_url = adminUrlEnv;
  let site_url = siteUrlEnv;

  try {
    const body = await req.json();
    tenant_id = String(body?.tenant_id ?? "").trim();
    tenant_slug = String(body?.tenant_slug ?? "").trim();
    tenant_name = String(body?.tenant_name ?? "").trim();
    owner_email = String(body?.owner_email ?? "").trim().toLowerCase();
    locale = String(body?.locale ?? "sl").trim();
    admin_url = String(body?.admin_url ?? adminUrlEnv).replace(/\/$/, "");
    site_url = String(body?.site_url ?? siteUrlEnv).replace(/\/$/, "");
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, 400);
  }

  console.log("[send-owner-invite] start", {
    tenant_id,
    tenant_slug,
    owner_email: maskEmail(owner_email),
    locale,
  });

  if (!owner_email || !owner_email.includes("@")) return json({ ok: false, error: "Invalid owner_email" }, 400);
  if (!tenant_id) return json({ ok: false, error: "Missing tenant_id" }, 400);

  // ── Verify caller is MASTER ─────────────────────────────────────────────────
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: callerUser, error: callerErr } = await callerClient.auth.getUser();
  if (callerErr) {
    console.error("[send-owner-invite] caller auth getUser error", callerErr);
    return json({ ok: false, error: "Unauthorized" }, 401);
  }

  const callerId = callerUser?.user?.id ?? "";
  if (!callerId) return json({ ok: false, error: "Unauthorized" }, 401);

  const { data: callerProfile, error: profReadErr } = await callerClient
    .from("user_profiles")
    .select("role")
    .eq("user_id", callerId)
    .maybeSingle();

  if (profReadErr) {
    console.error("[send-owner-invite] caller profile read error", profReadErr);
    return json({ ok: false, error: "Forbidden" }, 403);
  }

  if (!callerProfile || callerProfile.role !== "MASTER") {
    return json({ ok: false, error: "Forbidden — only MASTER can invite owners" }, 403);
  }

  // ── Service-role client ─────────────────────────────────────────────────────
  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // ── Step 1: generateLink (type "invite") — creates user WITHOUT Supabase email ──
    let userId = "";
    let action_link = "";

    const { data: inviteData, error: inviteErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "invite",
      email: owner_email,
      options: { redirectTo: admin_url },
    });

    if (!inviteErr && inviteData?.user) {
      userId = inviteData.user.id;
      const props = (inviteData as { properties?: { action_link?: string } }).properties ?? {};
      action_link = props.action_link ?? "";
      console.log("[send-owner-invite] generateLink invite OK", { userId });
    } else {
      console.warn("[send-owner-invite] generateLink invite failed, fallback to existing+magiclink", {
        message: inviteErr?.message ?? "unknown",
      });

      const { data: listData, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (listErr) {
        console.error("[send-owner-invite] listUsers failed", listErr);
        return json({ ok: false, error: "list_users_failed", details: listErr.message }, 500);
      }
      const existing = (listData?.users ?? []).find((u) => (u.email ?? "").toLowerCase() === owner_email);
      if (!existing) {
        return json({
          ok: false,
          error: "Failed to create/find user",
          details: inviteErr?.message ?? "unknown",
        }, 500);
      }

      userId = existing.id;

      const { data: mlData, error: mlErr } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: owner_email,
        options: { redirectTo: admin_url },
      });

      if (mlErr) {
        console.error("[send-owner-invite] generateLink magiclink failed", mlErr);
        return json({ ok: false, error: "magiclink_failed", details: mlErr.message }, 500);
      }

      const mlProps = (mlData as { properties?: { action_link?: string } } | null)?.properties ?? {};
      action_link = mlProps.action_link ?? "";
      console.log("[send-owner-invite] generateLink magiclink OK", { userId });
    }

    if (!userId) return json({ ok: false, error: "Could not determine user ID" }, 500);

    // ── Step 2: DB first (pending_owner_invites), then email ───────────────────
    const poi = await upsertPendingInvite(supabaseAdmin, owner_email, tenant_id);
    if (!poi.ok) {
      const dbError = { table: "pending_owner_invites", tenant_id, owner_email, details: poi.error || null };
      throw new Error("Database insert failed: " + JSON.stringify(dbError));
    }
    console.log("[send-owner-invite] pending_owner_invites OK", { mode: poi.mode });

    // ── Step 3: Upsert user_profiles ────────────────────────────────────────────
    const { error: profErr } = await supabaseAdmin
      .from("user_profiles")
      .upsert(
        { user_id: userId, role: "OWNER", tenant_id, email: owner_email },
        { onConflict: "user_id" },
      );

    if (profErr) {
      console.warn("[send-owner-invite] user_profiles upsert with email failed, retry without email", {
        message: profErr.message,
      });

      const { error: profErr2 } = await supabaseAdmin
        .from("user_profiles")
        .upsert({ user_id: userId, role: "OWNER", tenant_id }, { onConflict: "user_id" });

      if (profErr2) {
        throw new Error("Database insert failed: " + JSON.stringify(profErr2));
      }
    }

    // ── Step 4: Seed permissions ────────────────────────────────────────────────
    const perms = [
      { tenant_id, role: "OWNER", section_key: "info", item_key: "default_config", can_view: true, can_edit: true },
      { tenant_id, role: "OWNER", section_key: "parking", item_key: "parking_recommended", can_view: true, can_edit: true },
      { tenant_id, role: "OWNER", section_key: "house_rules", item_key: "house_rules_private", can_view: true, can_edit: true },
      { tenant_id, role: "OWNER", section_key: "booking", item_key: "rebook", can_view: true, can_edit: true },
    ];

    const { error: permErr } = await supabaseAdmin
      .from("permissions")
      .upsert(perms, { onConflict: "tenant_id,role,section_key,item_key", ignoreDuplicates: false });

    if (permErr) {
      throw new Error("Database insert failed: " + JSON.stringify(permErr));
    }

    // ── Step 5: Build and send ONE email via Resend ─────────────────────────────
    const manage_url = tenant_slug ? `${admin_url}?tenant=${encodeURIComponent(tenant_slug)}` : admin_url;

  // BITNO: tvoj sistem koristi index.html?t=slug (sigurno radi)
    const guest_url = tenant_slug
      ? `${site_url}/index.html?t=${encodeURIComponent(tenant_slug)}`
      : site_url;

    const subject = locale === "sl"
      ? `Dostop do admin panela – ${tenant_name || tenant_slug || "apartma"}`
      : `Invitation to access the admin panel – ${tenant_name || tenant_slug || "apartment"}`;

    const html = locale === "sl"
      ? buildEmailSl({ tenant_name: tenant_name || tenant_slug || "apartma", action_link, admin_url, manage_url, guest_url })
      : buildEmailEn({ tenant_name: tenant_name || tenant_slug || "apartment", action_link, admin_url, manage_url, guest_url });

    const fromAddr = `${fromName} <${fromEmail}>`;

    console.log("[send-owner-invite] resend request", {
      from: fromAddr,
      to: maskEmail(owner_email),
      subject,
      tenant_id,
      tenant_slug,
    });

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddr,
        to: [owner_email],
        subject,
        html,
        text: `Owner invite for ${tenant_name || tenant_slug || "apartment"}`,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error("[send-owner-invite] Resend error", errText);
      // User is linked anyway, return partial success
      return json({
        ok: true,
        email_sent: false,
        email_error: errText,
        duration_ms: Date.now() - startedAt,
      }, 200);
    }

    const resendJson = await resendRes.json();
    console.log("[send-owner-invite] Email sent", { id: resendJson?.id ?? null });

    return json({
      ok: true,
      email_sent: true,
      resend_id: resendJson?.id ?? null,
      duration_ms: Date.now() - startedAt,
    }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[send-owner-invite] fatal error", { tenant_id, owner_email: maskEmail(owner_email), error: message });
    return json({ ok: false, error: message }, 500);
  }
});