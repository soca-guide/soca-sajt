// Supabase Edge Function: send-email
// Šalje email obaveštenja via Resend kad se ubaci novi red u bazu.
// Poziva je Database Webhook za tabele: suggestions, maintenance_reports, lost_found_posts
//
// Env vars (podesiti u Supabase Dashboard → Settings → Edge Functions → Secrets):
//   RESEND_API_KEY          — Resend API ključ (re_...)
//   NOTIFY_EMAIL            — Email na koji stižu obaveštenja (tvoj email)
//   WEBHOOK_SECRET          — Tajni token za verifikaciju webhook poziva

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

// ── Email templates ───────────────────────────────────────────────────────────

function templateOwnerWelcome(row: Record<string, unknown>): { subject: string; html: string; to: string } {
  const ownerEmail  = String(row.email        || '');
  const tenantName  = String(row.tenant_name  || 'apartma');
  const tenantSlug  = String(row.tenant_slug  || '');
  const siteUrl     = (Deno.env.get('SITE_URL') ?? '').replace(/\/$/, '');
  // Prefer directly-passed URLs (direct call), fall back to SITE_URL + slug (webhook)
  const guestUrl    = String(row.guest_url || '') ||
    (siteUrl ? `${siteUrl}/index.html?t=${encodeURIComponent(tenantSlug)}` : `?t=${tenantSlug}`);
  const adminUrl    = String(row.admin_url || '') ||
    (siteUrl ? `${siteUrl}/admin/` : '/admin/');
  return {
    to: ownerEmail,
    subject: `🏡 Dobrodošli v Soča Guide — "${tenantName}"`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0d1f1a;border-radius:16px;color:#e5e7eb">
        <h2 style="color:#22d3ee;margin-top:0">🏡 Vaš apartma je pripravljen!</h2>
        <p style="color:#a7f3d0">Pozdravljeni!<br><br>Ustvarjen je bil vaš apartma <strong style="color:#fff">»${tenantName}«</strong> na platformi Soča Guide.</p>

        <div style="background:#0a2e1f;border:1px solid #059669;border-radius:12px;padding:16px;margin:20px 0">
          <p style="margin:0 0 6px;font-size:13px;color:#4ade80;font-weight:600">🔑 Skrbniška plošča — upravljajte z apartmajem:</p>
          <a href="${adminUrl}" style="color:#22d3ee;word-break:break-all">${adminUrl}</a>
          <p style="margin:12px 0 0;font-size:12px;color:#9ca3af">Odprite skrbniško ploščo in se prijavite z e-poštnim naslovom prek možnosti <strong style="color:#e5e7eb">»Pošlji čarobno povezavo«</strong>. Na vaš e-naslov boste prejeli neposredno prijavno povezavo.</p>
        </div>

        <div style="background:#0a1e2e;border:1px solid #0369a1;border-radius:12px;padding:16px;margin:20px 0">
          <p style="margin:0 0 6px;font-size:13px;color:#38bdf8;font-weight:600">🔗 Povezava za goste — delite z gosti:</p>
          <a href="${guestUrl}" style="color:#7dd3fc;word-break:break-all">${guestUrl}</a>
          <p style="margin:12px 0 0;font-size:12px;color:#9ca3af">Gostje odprejo to povezavo in vidijo vodič za vaš apartma.</p>
        </div>

        <div style="background:#1a1a0f;border:1px solid #a16207;border-radius:12px;padding:16px;margin:20px 0">
          <p style="margin:0 0 8px;font-size:13px;color:#fbbf24;font-weight:600">📋 Kaj lahko nastavite na skrbniški plošči:</p>
          <ul style="margin:0;padding-left:18px;color:#d1d5db;font-size:13px;line-height:1.8">
            <li>Ime apartmaja in kontaktne informacije</li>
            <li>Hišni red z ikonami</li>
            <li>Priporočeno parkirišče z navodili</li>
            <li>Vaše podjetje (neobvezno — prikazano gostom)</li>
            <li>Povezava za ponovne rezervacije</li>
          </ul>
        </div>

        <p style="font-size:12px;color:#4b5563;margin-top:24px">Soča Guide — digitalni vodič za turiste v dolini Soče</p>
      </div>`,
  };
}

function templateSuggestion(row: Record<string, unknown>): { subject: string; html: string } {
  return {
    subject: `💡 Nova predlog za poboljšanje — Soča Sajt`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px">
        <h2 style="color:#0e7490;margin-top:0">💡 Novi predlog za poboljšanje</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;width:140px">Email gosta:</td>
              <td style="padding:6px 0;font-weight:600">${row.email || '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px">Opština:</td>
              <td style="padding:6px 0">${row.tenant_slug || '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px">Šta dodati:</td>
              <td style="padding:6px 0">${row.add_text || '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px">Šta je nejasno:</td>
              <td style="padding:6px 0">${row.confusing || '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px">Poruka:</td>
              <td style="padding:6px 0">${row.message || '—'}</td></tr>
        </table>
        <p style="font-size:12px;color:#9ca3af;margin-top:24px">
          Primljeno: ${new Date(row.created_at as string || Date.now()).toLocaleString('sr-RS')}
        </p>
      </div>`,
  };
}

function templateMaintenance(row: Record<string, unknown>): { subject: string; html: string } {
  const categoryMap: Record<string, string> = {
    electricity: '⚡ Struja',
    water: '💧 Voda/vodoinstalacija',
    wifi: '📶 WiFi',
    heating: '🌡️ Grejanje',
    cleaning: '🧹 Čišćenje',
    appliance: '🔧 Aparat/uređaj',
    other: '❓ Ostalo',
  };
  const cat = categoryMap[row.category as string] || String(row.category || '—');
  return {
    subject: `🔧 Prijava kvara — ${cat} — Soča Sajt`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#fff7ed;border-radius:12px;border-left:4px solid #f97316">
        <h2 style="color:#c2410c;margin-top:0">🔧 Prijava kvara od gosta</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;width:140px">Kategorija:</td>
              <td style="padding:6px 0;font-weight:700">${cat}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px">Lokacija:</td>
              <td style="padding:6px 0">${row.location || '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px">Opis:</td>
              <td style="padding:6px 0">${row.description || '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px">Opština/objekat:</td>
              <td style="padding:6px 0">${row.tenant_slug || '—'}</td></tr>
        </table>
        <p style="font-size:12px;color:#9ca3af;margin-top:24px">
          Primljeno: ${new Date(row.created_at as string || Date.now()).toLocaleString('sr-RS')}
        </p>
      </div>`,
  };
}

function templateRebook(payload: Record<string, unknown>): { subject: string; html: string } {
  const guestEmail  = String(payload.guest_email   || '—');
  const aptName     = String(payload.apartment_name || '');
  const ownerPhone  = String(payload.owner_phone   || '—');
  const rebookLink  = String(payload.rebook_link   || '');
  return {
    subject: `📅 Zahtev za ponovnu rezervaciju — ${aptName || 'apartma'}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f0f9ff;border-radius:12px;border-left:4px solid #0ea5e9">
        <h2 style="color:#0369a1;margin-top:0">📅 Gost želi ponovo da rezerviše</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;width:140px">Apartma:</td>
              <td style="padding:6px 0;font-weight:700">${aptName || '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px">Email gosta:</td>
              <td style="padding:6px 0;font-weight:600">${guestEmail}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px">Vaš telefon:</td>
              <td style="padding:6px 0">${ownerPhone}</td></tr>
          ${rebookLink ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:14px">Link za rez.:</td>
              <td style="padding:6px 0"><a href="${rebookLink}" style="color:#0ea5e9">${rebookLink}</a></td></tr>` : ''}
        </table>
        <p style="font-size:12px;color:#9ca3af;margin-top:24px">
          Primljeno: ${new Date().toLocaleString('sr-RS')}
        </p>
      </div>`,
  };
}

function templateLostFound(row: Record<string, unknown>): { subject: string; html: string } {
  const typeLabel = row.post_type === 'found' ? '✅ Pronađeno' : '🔍 Izgubljeno';
  return {
    subject: `${typeLabel} — nova objava — Soča Sajt`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f0fdf4;border-radius:12px;border-left:4px solid #22c55e">
        <h2 style="color:#15803d;margin-top:0">${typeLabel} — nova objava</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;width:140px">Kontakt:</td>
              <td style="padding:6px 0;font-weight:600">${row.contact || '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px">Opis:</td>
              <td style="padding:6px 0">${row.description || '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px">Lokacija:</td>
              <td style="padding:6px 0">${row.location || '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px">Opština:</td>
              <td style="padding:6px 0">${row.municipality_slug || '—'}</td></tr>
        </table>
        <p style="font-size:12px;color:#9ca3af;margin-top:24px">
          Primljeno: ${new Date(row.created_at as string || Date.now()).toLocaleString('sr-RS')}
        </p>
      </div>`,
  };
}

// ── Resend helper ─────────────────────────────────────────────────────────────
async function sendViaResend(
  resendKey: string,
  to: string,
  subject: string,
  html: string,
  from: string,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!res.ok) { const err = await res.text(); return { ok: false, error: err }; }
  const data = await res.json();
  return { ok: true, id: data.id };
}

// ── Handler ───────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const resendKey   = Deno.env.get('RESEND_API_KEY')    ?? '';
    const notifyEmail = Deno.env.get('NOTIFY_EMAIL')      ?? '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')      ?? '';
    const anonKey     = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // ── FROM address — use verified domain in prod, fallback in dev ──────────
    const env         = (Deno.env.get('ENV') ?? Deno.env.get('NODE_ENV') ?? 'dev').toLowerCase();
    const fromEmail   = Deno.env.get('FROM_EMAIL') ?? '';
    const fallbackFrom = 'Soča Guide <onboarding@resend.dev>';
    const finalFrom   = fromEmail || (env === 'production' ? '' : fallbackFrom);

    if (env === 'production' && !finalFrom) {
      console.error('send-email: FROM_EMAIL secret is required in production');
      return new Response(JSON.stringify({ error: 'Missing FROM_EMAIL secret' }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    if (!resendKey) {
      return new Response(JSON.stringify({ error: 'Missing RESEND_API_KEY' }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const payload = await req.json();

    // ── Direct call: action=owner_invite (MASTER JWT required) ────────────────
    if (payload.action === 'owner_invite') {
      // Verify caller is MASTER via JWT → user_id → user_profiles
      const authHeader = req.headers.get('authorization') ?? '';
      if (supabaseUrl && anonKey && authHeader) {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        const caller = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        // Get user_id from JWT first, then filter profile by user_id
        const { data: userData } = await caller.auth.getUser();
        const userId = userData?.user?.id;
        if (!userId) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
          });
        }
        const { data: prof } = await caller
          .from('user_profiles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();
        if (!prof || prof.role !== 'MASTER') {
          return new Response(JSON.stringify({ error: 'Forbidden' }), {
            status: 403, headers: { ...CORS, 'Content-Type': 'application/json' },
          });
        }
      }
      const ownerEmail  = String(payload.owner_email  || '');
      const tenantName  = String(payload.tenant_name  || 'vaš apartman');
      const guestUrl    = String(payload.guest_url    || '');
      const adminUrl    = String(payload.admin_url    || '');
      if (!ownerEmail || !ownerEmail.includes('@')) {
        return new Response(JSON.stringify({ error: 'Missing owner_email' }), {
          status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }
      const tpl = templateOwnerWelcome({ email: ownerEmail, tenant_name: tenantName,
                                         guest_url: guestUrl, admin_url: adminUrl });
      const result = await sendViaResend(resendKey, tpl.to, tpl.subject, tpl.html, finalFrom);
      return new Response(JSON.stringify(result), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // ── Direct call: action=maintenance_notify (guest, no auth required) ─────────
    if (payload.action === 'maintenance_notify') {
      const ownerEmail = String(payload.owner_email || '');
      if (!ownerEmail || !ownerEmail.includes('@')) {
        return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'no_owner_email' }), {
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }
      const row = {
        category:    payload.category    ?? 'other',
        location:    payload.location    ?? '',
        description: payload.description ?? '',
        tenant_slug: payload.tenant_slug ?? '',
      };
      const tpl = templateMaintenance(row);
      const result = await sendViaResend(resendKey, ownerEmail, tpl.subject, tpl.html, finalFrom);
      return new Response(JSON.stringify(result), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // ── Direct call: action=rebook_notify (guest, no auth required) ───────────
    if (payload.action === 'rebook_notify') {
      const ownerEmail = String(payload.owner_email || '');
      if (!ownerEmail || !ownerEmail.includes('@')) {
        return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'no_owner_email' }), {
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }
      const tpl = templateRebook(payload);
      const result = await sendViaResend(resendKey, ownerEmail, tpl.subject, tpl.html, finalFrom);
      return new Response(JSON.stringify(result), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // ── Webhook path: verify secret ────────────────────────────────────────────
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
    if (webhookSecret) {
      const incoming = req.headers.get('x-webhook-secret');
      if (incoming !== webhookSecret) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }
    }

    if (!notifyEmail) {
      return new Response(JSON.stringify({ error: 'Missing NOTIFY_EMAIL' }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Webhook payload from Supabase Database Webhook
    const table: string = payload.table || '';
    const row: Record<string, unknown> = payload.record || {};

    // Build email based on table
    let template: { subject: string; html: string; to?: string } | null = null;

    if (table === 'pending_owner_invites') {
      // Welcome email direktno vlasniku (ne NOTIFY_EMAIL)
      template = templateOwnerWelcome(row);
    } else if (table === 'suggestions') {
      template = templateSuggestion(row);
    } else if (table === 'maintenance_reports') {
      template = templateMaintenance(row);
    } else if (table === 'lost_found_posts') {
      template = templateLostFound(row);
    } else {
      // Unknown table — log and return OK (don't block webhook)
      console.log(`send-email: unknown table "${table}", skipping`);
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // owner welcome ide na owner email; sve ostalo ide na notifyEmail
    const sendTo = (template as { to?: string }).to || notifyEmail;
    if (!sendTo || !sendTo.includes('@')) {
      console.log('send-email: no valid recipient, skipping');
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const result = await sendViaResend(resendKey, sendTo, template.subject, template.html, finalFrom);
    if (!result.ok) {
      console.error('Resend error:', result.error);
      return new Response(JSON.stringify({ ok: false, email_error: result.error }), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    console.log('Email sent:', result.id);
    return new Response(JSON.stringify({ ok: true, email_id: result.id }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('send-email exception:', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 200, // 200 so webhook doesn't retry
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
