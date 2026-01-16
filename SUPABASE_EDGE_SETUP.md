# Supabase Edge Cron Setup (Netlify Scheduled Functions o'rniga)

Bu repo ichida cron endpoint allaqachon bor:
- `GET /api/push-cron`
- himoya: `Authorization: Bearer <CRON_SECRET>`

Netlify Scheduled Function o'chirildi va uning o'rniga Supabase Edge Function qo'shildi.

## 1) Netlify env (kichik bo'lishi kerak)
Netlify'ga faqat shularni bering (misol `.env.example`):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `CRON_SECRET`

> Muhim: Netlify env'ga katta Firebase service account JSON/B64 qo'ymang.

## 2) Supabase Function Secrets
Supabase Dashboard → Project Settings → Functions → Secrets:
- `SITE_BASE_URL`  (Netlify'dagi prod URL, masalan `https://your-site.netlify.app`)
- `CRON_SECRET`    (Netlify'dagi bilan bir xil)
- `TRIGGER_TOKEN`  (ixtiyoriy qo'shimcha himoya)

## 3) Edge Function deploy
Supabase CLI ishlatsangiz:
```bash
supabase functions deploy trigger-push-cron
```

## 4) Supabase cron (pg_cron + pg_net)
SQL Editor'da `scripts/004_supabase_edge_cron.sql` faylini ishga tushiring.
Unda:
- extensionlar yoqiladi
- har kuni 04:00 UTC (Toshkent 09:00) da Edge Function chaqiriladi

Agar `TRIGGER_TOKEN` ishlatmasangiz, SQL ichidan Authorization header qatorini olib tashlang.
