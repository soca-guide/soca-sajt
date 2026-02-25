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

// ── Handler ───────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    // Verify webhook secret to prevent unauthorized calls
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
    if (webhookSecret) {
      const incoming = req.headers.get('x-webhook-secret');
      if (incoming !== webhookSecret) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }
    }

    const resendKey = Deno.env.get('RESEND_API_KEY');
    const notifyEmail = Deno.env.get('NOTIFY_EMAIL');

    if (!resendKey || !notifyEmail) {
      console.error('Missing RESEND_API_KEY or NOTIFY_EMAIL env vars');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Webhook payload from Supabase Database Webhook
    const payload = await req.json();
    const table: string = payload.table || '';
    const row: Record<string, unknown> = payload.record || {};

    // Build email based on table
    let template: { subject: string; html: string } | null = null;

    if (table === 'suggestions') {
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

    // Send via Resend REST API (no SDK needed — native fetch works in Deno)
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Soča Sajt <onboarding@resend.dev>',
        to: [notifyEmail],
        subject: template.subject,
        html: template.html,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error('Resend error:', resendRes.status, errBody);
      // Return 200 anyway so Supabase doesn't retry the webhook infinitely
      return new Response(JSON.stringify({ ok: false, email_error: errBody }), {
        status: 200,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const resendData = await resendRes.json();
    console.log('Email sent:', resendData.id);

    return new Response(JSON.stringify({ ok: true, email_id: resendData.id }), {
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
