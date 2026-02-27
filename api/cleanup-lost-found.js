/**
 * GET /api/cleanup-lost-found
 * Deletes lost_found_posts older than 7 days.
 * Called by Vercel Cron (daily at 03:00 UTC) — see vercel.json
 * Requires env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY
 *
 * To protect manual calls, accepts optional header:
 *   Authorization: Bearer <CRON_SECRET>
 * Set CRON_SECRET in Vercel env vars (any random string).
 */
module.exports = async function handler(req, res) {
  // Only allow GET (Vercel Cron) or internal calls
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Optional simple auth guard for manual calls
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = req.headers['authorization'] || '';
    if (authHeader !== `Bearer ${secret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hkztanenhxoducivluor.supabase.co';
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;

  if (!SERVICE_KEY) {
    // Fallback: call the RPC with anon key (security-definer function can delete)
    const ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_VJewQ-VKXAyCQyK_FtVPow_HOP0_UiT';
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/cleanup_lost_found_posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`
        },
        body: JSON.stringify({})
      });
      if (!r.ok) {
        const err = await r.text();
        return res.status(500).json({ error: 'RPC failed', detail: err });
      }
      return res.json({ ok: true, method: 'rpc_anon' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // With service key: direct DELETE older than 7 days
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/lost_found_posts?created_at=lt.${encodeURIComponent(cutoff)}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      }
    );
    if (!r.ok) {
      const err = await r.text();
      return res.status(500).json({ error: 'Delete failed', detail: err });
    }
    const deleted = await r.json().catch(() => []);
    const count   = Array.isArray(deleted) ? deleted.length : '?';
    console.log(`[cleanup-lost-found] Deleted ${count} entries older than ${cutoff}`);
    return res.json({ ok: true, deleted: count, cutoff });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
