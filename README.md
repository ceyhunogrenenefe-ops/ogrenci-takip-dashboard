# Online VIP — Öğrenci Takip CRM

Tek Next.js uygulaması: Kanban CRM + WhatsApp webhook/send.

Stack: **Next.js 14** · **Prisma** · **Supabase Postgres** · **Vercel** · **GitHub**

## Lokal geliştirme

```bash
cp .env.example .env
# .env içine Supabase DATABASE_URL + DIRECT_URL yaz

npm install
npm run db:push
npm run db:seed
npm run dev
```

- UI: http://localhost:3000  
- Login: `admin@onlinevipdershane.com` / `demo1234`

## Ortam değişkenleri

| Key | Açıklama |
|-----|----------|
| `DATABASE_URL` | Supabase Transaction pooler (`:6543` + `?pgbouncer=true`) |
| `DIRECT_URL` | Supabase Direct (`:5432`) — migrate/db push |
| `JWT_SECRET` | Session imza anahtarı |
| `WHATSAPP_TOKEN` | Meta Cloud API token |
| `WHATSAPP_PHONE_ID` | Phone Number ID |
| `WHATSAPP_VERIFY_TOKEN` | Webhook verify token |
| `WHATSAPP_API_VERSION` | Varsayılan `v21.0` |

## WhatsApp

- `POST /api/send-message` — `{ to, message }`
- `GET/POST /api/webhook` — Meta callback (URL aynı kalır)

## Vercel

Root Directory: **`.`** (repo kökü)

Build: `prisma generate && next build` (`npm run build`)

Aynı env’leri Vercel Project Settings’e ekle. Redeploy sonrası:

`https://ogrenci-takip-dashboard.vercel.app`

## Pipeline durumları

NEW → CONTACTED → THINKING → TRIAL → WON → LOST

## Roller

SUPER_ADMIN · ADMIN · SALES
