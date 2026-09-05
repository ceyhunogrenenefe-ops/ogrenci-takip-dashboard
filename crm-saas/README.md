# CRM SaaS Monorepo

```
crm-saas/
├── apps/
│   ├── web/     # Next.js UI
│   └── api/     # Next.js API
├── packages/
│   ├── db/      # Prisma + Supabase Postgres
│   └── ui/
└── scripts/
```

Stack: **Supabase (Postgres)** + **GitHub** + **Vercel**

## 1) Supabase

1. [Supabase](https://supabase.com/dashboard) → proje aç (veya mevcut)
2. **Project Settings → Database → Connection string → URI**
3. İki string kopyala:
   - **Transaction pooler** (port `6543`) → `DATABASE_URL` (+ `?pgbouncer=true`)
   - **Direct** (port `5432`) → `DIRECT_URL`
4. PowerShell:

```powershell
cd crm-saas
.\scripts\use-supabase.ps1 `
  -DatabaseUrl "postgresql://postgres.REF:PASS@....pooler.supabase.com:6543/postgres?pgbouncer=true" `
  -DirectUrl   "postgresql://postgres.REF:PASS@....pooler.supabase.com:5432/postgres"
```

Bu komut `.env` dosyalarını yazar, şemayı push eder ve demo seed atar.

Login: `admin@onlinevipdershane.com` / `demo1234`

Lokal:

```bash
npm install
npm run dev
```

- UI: http://localhost:3000  
- API: http://localhost:3001  

## 2) GitHub

Repo: `ceyhunogrenenefe-ops/ogrenci-takip-dashboard`  
`crm-saas/` klasörünü `main`'e commit + push et (`.env` gitignore'da — asla commit etme).

## 3) Vercel (2 proje)

Mevcut WhatsApp dashboard kökte kalır. CRM için **ayrı** iki Vercel projesi:

### A) API — `onlinevip-crm-api`

| Ayar | Değer |
|------|--------|
| Root Directory | `crm-saas/apps/api` |
| Framework | Next.js |
| Install / Build | `vercel.json` içinde |

Env:

- `DATABASE_URL` (pooler)
- `DIRECT_URL` (direct)
- `JWT_SECRET`
- `API_CORS_ORIGIN` = web URL (örn. `https://onlinevip-crm.vercel.app`)
- `WHATSAPP_API_URL` = `https://ogrenci-takip-dashboard.vercel.app/api/send-message`

### B) Web — `onlinevip-crm`

| Ayar | Değer |
|------|--------|
| Root Directory | `crm-saas/apps/web` |

Env:

- `NEXT_PUBLIC_API_URL` = API URL (örn. `https://onlinevip-crm-api.vercel.app`)
- `NEXT_PUBLIC_APP_NAME` = `Online VIP CRM`

Deploy sonrası web'de `NEXT_PUBLIC_API_URL` ve API'de `API_CORS_ORIGIN` birbirini göstermeli.

## Schema notes

- Provider: **PostgreSQL (Supabase)**
- `className` → DB column `class`
- Pipeline: NEW → CONTACTED → THINKING → TRIAL → WON → LOST
- Roles: SUPER_ADMIN | ADMIN | SALES
