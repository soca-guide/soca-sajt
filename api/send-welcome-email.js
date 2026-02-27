/**
 * POST /api/send-welcome-email
 * Sends a welcome email to a newly created owner with their panel link.
 * Body: { owner_email, tenant_name, tenant_slug, guest_url, admin_url }
 */
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { owner_email, tenant_name, tenant_slug, guest_url, admin_url } = req.body || {};

  if (!owner_email || owner_email.indexOf('@') < 0) {
    return res.status(400).json({ error: 'Invalid or missing owner_email' });
  }
  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
  }

  const panelUrl   = admin_url || 'https://revantora.com/admin/';
  const guestLink  = guest_url || `https://revantora.com/?t=${encodeURIComponent(tenant_slug || '')}`;
  const name       = tenant_name || tenant_slug || 'apartma';

  const subject = `Dobrodošli v Soča Guide – Vaš panel je pripravljen`;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f3f4f6;font-family:system-ui,sans-serif">
<div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
  <div style="background:linear-gradient(135deg,#065f46,#10b981);padding:32px 32px 24px">
    <div style="font-size:26px;font-weight:800;color:#fff">🌊 Soča Guide</div>
    <div style="font-size:14px;color:rgba(255,255,255,0.75);margin-top:6px">Dobrodošli, ${esc(name)}!</div>
  </div>
  <div style="padding:28px 32px">
    <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#111">Vaš apartma je bil uspešno ustvarjen.</p>
    <p style="margin:0 0 24px;color:#4b5563;font-size:14px;line-height:1.6">
      Prijavite se v vaš admin panel, uredite podatke apartmaja in ga nastavite za goste.
    </p>

    <a href="${esc(panelUrl)}" style="display:inline-block;background:#10b981;color:#fff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 28px;border-radius:10px;margin-bottom:24px">
      Odpri admin panel →
    </a>

    <div style="background:#f0fdf4;border-radius:10px;padding:16px 18px;margin-bottom:20px">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#065f46">🔗 Vaš link za goste:</p>
      <a href="${esc(guestLink)}" style="color:#10b981;font-size:13px;word-break:break-all">${esc(guestLink)}</a>
    </div>

    <div style="padding:14px 16px;background:#eff6ff;border-radius:10px;border-left:3px solid #3b82f6;font-size:13px;color:#1e3a5f;line-height:1.6">
      <strong>Naslednji korak:</strong> Prijavite se v admin panel in izpolnite:<br>
      telefon, podatke za parkiranje, pravila hiše in e-naslov za prijave okvar.
    </div>

    <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:13px;color:#6b7280">
      Lep pozdrav,<br><strong>Ekipa Soča Guide</strong>
    </div>
  </div>
  <div style="background:#f9fafb;padding:12px 32px;font-size:11px;color:#9ca3af;text-align:center">
    To sporočilo ste prejeli, ker je bil ustvarjen vaš apartma na platformi Soča Guide.
  </div>
</div></body></html>`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({ from: 'Soča Guide <noreply@revantora.com>', to: [owner_email], subject, html })
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
