/**
 * POST /api/send-maintenance-email
 * Sends maintenance notification to the OWNER via Resend.
 * Body: { owner_email, tenant_slug, category, location, description, apartment_name }
 * Returns: { ok: true } or { error: '...' }
 */
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { owner_email, tenant_slug, category, location, description, apartment_name } = req.body || {};

  if (!owner_email || owner_email.indexOf('@') < 0) {
    return res.status(400).json({ error: 'Invalid or missing owner_email' });
  }
  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
  }

  const aptLabel  = apartment_name || tenant_slug || 'Apartma';
  const catLabels = { plumbing: '🚿 Vodovodna napeljava', electrical: '⚡ Elektrika', hvac: '🌡️ Ogrevanje / klimatizacija', furniture: '🪑 Pohištvo', locks: '🔑 Ključavnice / vrata', other: '🔧 Drugo' };
  const catDisplay = catLabels[category] || catLabels.other;
  const now = new Date().toLocaleString('sl-SI', { timeZone: 'Europe/Ljubljana', hour12: false });

  const rows = [
    `<tr><td style="color:#6b7280;padding:6px 0;width:130px;font-size:13px">Apartma</td><td style="font-weight:600">${esc(aptLabel)}</td></tr>`,
    `<tr><td style="color:#6b7280;padding:6px 0;font-size:13px">Kategorija</td><td>${esc(catDisplay)}</td></tr>`,
    location ? `<tr><td style="color:#6b7280;padding:6px 0;font-size:13px">Lokacija</td><td>${esc(location)}</td></tr>` : '',
    `<tr><td style="color:#6b7280;padding:6px 0;font-size:13px">Čas prijave</td><td>${esc(now)}</td></tr>`
  ].filter(Boolean).join('');

  const descHtml = description
    ? `<div style="margin-top:20px;padding:14px 16px;background:#fef9ec;border-radius:10px;border-left:3px solid #f59e0b"><p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#92400e">OPIS OKVARE</p><p style="margin:0;white-space:pre-wrap;font-size:14px">${esc(description)}</p></div>`
    : '';

  const subject = `[OKVARA] ${aptLabel} – ${catDisplay.replace(/^[^ ]+ /, '')}`;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f3f4f6;font-family:system-ui,sans-serif">
<div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
  <div style="background:linear-gradient(135deg,#7c3aed,#a78bfa);padding:28px 32px">
    <div style="font-size:22px;font-weight:700;color:#fff">🔧 Prijava okvare</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px">${esc(aptLabel)}</div>
  </div>
  <div style="padding:28px 32px">
    <p style="margin:0 0 6px;font-size:15px;font-weight:600">Gost je prijavil okvaro:</p>
    <table style="width:100%;border-collapse:collapse;margin-top:12px">${rows}</table>
    ${descHtml}
    <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:13px;color:#6b7280">
      Soča Guide – Avtomatska obvestila<br>
      <a href="https://revantora.com/admin/?t=${esc(tenant_slug || '')}" style="color:#7c3aed">Odpri admin panel →</a>
    </div>
  </div>
  <div style="background:#f9fafb;padding:12px 32px;font-size:11px;color:#9ca3af;text-align:center">To sporočilo ste prejeli, ker ste lastnik apartmaja v sistemu Soča Guide.</div>
</div></body></html>`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from:     'Soča Guide <noreply@revantora.com>',
        reply_to: 'noreply@revantora.com',
        to:       [owner_email],
        subject,
        html,
        headers:  { 'X-Entity-Ref-ID': `maint-${Date.now()}` }
      })
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.message || 'Resend error' });
    return res.json({ ok: true, id: data.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

function esc(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
