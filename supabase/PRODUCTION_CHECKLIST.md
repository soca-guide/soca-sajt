# 🚀 Production Checklist — Soča Guide

## ✅ Već urađeno
- [x] Resend API key postavljen (`RESEND_API_KEY`)
- [x] Notify email postavljen (`NOTIFY_EMAIL`)
- [x] Webhook secret postavljen (`WEBHOOK_SECRET`)
- [x] Site URL postavljen (`SITE_URL`)

---

## ⏳ Uradi kad kupiš domen (npr. soca.guide)

### 1. Resend — verificiraj domen
1. Idi na [resend.com](https://resend.com) → **Domains** → **Add Domain**
2. Unesi domen: `soca.guide`
3. Dodaj DNS zapise koje ti Resend da (SPF, DKIM) kod svog registrara
4. Klikni **Verify** — čekaj 10-60 min

### 2. Supabase — dodaj Secrets
Idi na: **Supabase Dashboard → Edge Functions → Secrets**

| Secret name | Vrijednost | Napomena |
|---|---|---|
| `FROM_EMAIL` | `Soča Guide <noreply@soca.guide>` | Zamijeni `soca.guide` sa tvojim domenom |
| `ENV` | `production` | Aktivira striktnu provjeru FROM_EMAIL |

> ⚠️ Bez `FROM_EMAIL` u produkciji, `send-email` Edge Function vraća 500 grešku.

### 3. Redeploy send-email
Nakon dodavanja Secrets, redeploy funkcije:
```bash
supabase functions deploy send-email --project-ref hkztanenhxoducivluor
```
ili kroz Dashboard → Edge Functions → send-email → Code → Deploy.

### 4. Test
Kreiraj test apartman u admin panelu sa stvarnim email-om i provjeri da vlasnik dobija welcome email SA tvog domena.

---

## 📋 Sve Supabase Secrets (referenca)

| Secret | Opis |
|---|---|
| `RESEND_API_KEY` | Resend API ključ (`re_...`) |
| `NOTIFY_EMAIL` | Email za notifikacije (tvoj) |
| `WEBHOOK_SECRET` | Tajni token za DB webhooks |
| `SITE_URL` | URL sajta bez `/` (`https://soca.guide`) |
| `FROM_EMAIL` | ⏳ Dodati kad domen bude verificiran |
| `ENV` | ⏳ Postaviti na `production` |

---

## 🔗 Korisni linkovi
- Resend dashboard: https://resend.com/domains
- Supabase Edge Functions: https://supabase.com/dashboard/project/hkztanenhxoducivluor/functions
- Supabase Secrets: https://supabase.com/dashboard/project/hkztanenhxoducivluor/settings/functions
