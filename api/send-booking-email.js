/**
 * POST /api/send-booking-email
 * Sends booking contact info to the TOURIST via Resend.
 * Body: { tourist_email, apartment_name, owner_phone, owner_email,
 *         rebook_link, instructions, lang }
 */
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    tourist_email, apartment_name, owner_phone,
    owner_email, rebook_link, instructions, lang = 'sl'
  } = req.body || {};

  if (!tourist_email || tourist_email.indexOf('@') < 0) {
    return res.status(400).json({ error: 'Invalid tourist_email' });
  }
  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
  }

  const labels = {
    sl: { subject: `Rezervacija – ${apartment_name || 'apartma'}`, greeting: 'Pozdravljeni!', intro: 'Tukaj so kontaktni podatki lastnika apartmaja:', apt: 'Apartma', phone: 'Telefon', email: 'E-pošta', link: 'Rezervacijska povezava', instr: 'Navodila', outro: 'Lepo se imejte! <br>Ekipa Soča Guide', note: 'To sporočilo ste prejeli, ker ste zaprosili za podatke za rezervacijo.' },
    en: { subject: `Booking – ${apartment_name || 'apartment'}`, greeting: 'Hello!', intro: "Here are your host's contact details:", apt: 'Apartment', phone: 'Phone', email: 'E-mail', link: 'Booking link', instr: 'Instructions', outro: 'Enjoy your stay!<br>Soča Guide Team', note: 'You received this email because you requested booking information.' },
    de: { subject: `Buchung – ${apartment_name || 'Apartment'}`, greeting: 'Hallo!', intro: 'Hier sind die Kontaktdaten des Gastgebers:', apt: 'Apartment', phone: 'Telefon', email: 'E-Mail', link: 'Buchungslink', instr: 'Hinweise', outro: 'Schönen Aufenthalt!<br>Soča Guide Team', note: 'Sie erhalten diese E-Mail, weil Sie Buchungsinformationen angefordert haben.' }
  };
  const t = labels[lang] || labels.sl;

  const rows = [
    `<tr><td style="color:#6b7280;padding:4px 0;width:120px">${t.apt}</td><td style="font-weight:600">${esc(apartment_name)}</td></tr>`,
    owner_phone ? `<tr><td style="color:#6b7280;padding:4px 0">${t.phone}</td><td><a href="tel:${esc(owner_phone)}" style="color:#10b981">${esc(owner_phone)}</a></td></tr>` : '',
    owner_email ? `<tr><td style="color:#6b7280;padding:4px 0">${t.email}</td><td><a href="mailto:${esc(owner_email)}" style="color:#10b981">${esc(owner_email)}</a></td></tr>` : '',
    rebook_link ? `<tr><td style="color:#6b7280;padding:4px 0">${t.link}</td><td><a href="${esc(rebook_link)}" style="color:#10b981">${esc(rebook_link)}</a></td></tr>` : ''
  ].filter(Boolean).join('');

  const instrHtml = instructions
    ? `<div style="margin-top:20px;padding:14px 16px;background:#f0fdf4;border-radius:10px;border-left:3px solid #10b981"><p style="margin:0 0 4px;font-size:13px;color:#6b7280;font-weight:600">${t.instr}</p><p style="margin:0;white-space:pre-wrap;font-size:14px">${esc(instructions)}</p></div>`
    : '';

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f3f4f6;font-family:system-ui,sans-serif">
<div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
  <div style="background:linear-gradient(135deg,#065f46,#10b981);padding:28px 32px">
    <div style="font-size:22px;font-weight:700;color:#fff">🌊 Soča Guide</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px">${t.subject}</div>
  </div>
  <div style="padding:28px 32px">
    <p style="margin:0 0 8px;font-size:16px;font-weight:600">${t.greeting}</p>
    <p style="margin:0 0 20px;color:#4b5563">${t.intro}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
    ${instrHtml}
    <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:13px;color:#6b7280">${t.outro}</div>
  </div>
  <div style="background:#f9fafb;padding:14px 32px;font-size:11px;color:#9ca3af;text-align:center">${t.note}</div>
</div></body></html>`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({ from: 'Soča Guide <noreply@revantora.com>', to: [tourist_email], subject: t.subject, html })
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
