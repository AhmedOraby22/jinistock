# AI Studio — Full Stack Scaffold

A standalone (non-Odoo) full-stack app for AI image/video/audio generation
with a credits system and Paymob (Egypt) payments. React frontend, Node/Express backend, **PostgreSQL** (Prisma).

## Structure

```
ai-studio/
├── backend/          Node.js + Express API
│   ├── config/db.js          Prisma / PostgreSQL connection
│   ├── prisma/schema.prisma  User, Transaction, Generation, CreditConfig
│   ├── middleware/auth.js    JWT auth guard
│   ├── routes/
│   │   ├── authRoutes.js      register / login / me
│   │   ├── generateRoutes.js  credit check -> deduct -> call AI provider
│   │   ├── paymentRoutes.js   Paymob checkout + webhook callback
│   │   └── creditRoutes.js    get current balance
│   ├── scripts/
│   │   ├── migrateUsersFromOdoo.js          import users from Odoo DB (or --xlsx)
│   │   ├── migrateCreditConfigFromOdoo.js   import pricing rules from Odoo DB
│   │   ├── seedCreditConfig.js              fallback seed from JSON
│   │   └── exportPasswordResetLinks.js
│   ├── services/
│   │   ├── aiProviderService.js
│   │   └── paymobService.js
│   └── server.js
└── frontend/          React (Vite)
```

## 1. PostgreSQL setup

Install PostgreSQL locally, then create two databases:

```bash
createdb ai_studio   # new app database
createdb jini        # restored Odoo dump (migration source only)
```

Restore your Odoo dump into `jini` (PowerShell example):

```powershell
# from the ai-studio repo root
$gz = ".\jini_db_20260723_211156.sql.gz"
$out = ".\jini_db_20260723_211156.sql"
$in = [IO.File]::OpenRead((Resolve-Path $gz))
$gzip = New-Object IO.Compression.GzipStream($in, [IO.Compression.CompressionMode]::Decompress)
$outFs = [IO.File]::Create((Join-Path (Get-Location) $out))
$gzip.CopyTo($outFs); $outFs.Close(); $gzip.Close(); $in.Close()
psql -d jini -f $out
```

## 2. Backend setup

```bash
cd backend
cp .env.example .env
# Set DATABASE_URL (ai_studio) and ODOO_DATABASE_URL (jini)
# Example: postgresql://postgres:YOUR_PASSWORD@localhost:5432/ai_studio?schema=public
npm install
npx prisma migrate dev --name init
npm run dev               # http://localhost:5000
```

### Migrate data from Odoo

```bash
# Users + credit balances (from restored jini DB)
node scripts/migrateUsersFromOdoo.js

# Or from the xlsx export instead:
node scripts/migrateUsersFromOdoo.js --xlsx

# Pricing rules from Odoo (or use seed JSON fallback)
node scripts/migrateCreditConfigFromOdoo.js
# node scripts/seedCreditConfig.js

# Bulk password-reset links for migrated users
node scripts/exportPasswordResetLinks.js
```

You also need:
- A `JWT_SECRET` (any long random string)
- Paymob credentials from https://accept.paymob.com/portal2/en/dashboard
- Webhook URL: `https://yourdomain.com/api/payment/callback`
- Redirect URL: `https://yourdomain.com/payment/callback`

## 3. Frontend setup

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:5000`.

## 4. Wiring up real AI models

`backend/services/aiProviderService.js` maps each "Choose Model" option to a provider call.

## 5. Credits & pricing

- Free/starter credits live on the `User` table (`imageCredits`, `videoCredits`).
- Per-generation costs come from `CreditConfig` / `CreditDeduction` (migrated from Odoo or seeded from JSON).
- Credit packages sold via Paymob are in `backend/routes/paymentRoutes.js` → `PACKAGES`.

## 6. Security notes before going to production

- Move CORS `origin` in `server.js` to your real domain, not `*`.
- Rate-limit `/api/generate` per user.
- Store uploaded input files in S3/Cloud Storage rather than local disk.
- Always verify the Paymob HMAC on the callback — never trust the frontend redirect alone to grant credits.
