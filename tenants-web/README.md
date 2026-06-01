# Tenants Web (Next.js + Supabase)

Free-tier-friendly deployment of the Property Manager app.

## Stack

- **Next.js** — UI + API routes (deploy to [Vercel](https://vercel.com) Hobby)
- **Supabase** — Postgres, Auth, RLS
- **GitHub Actions** — scheduled LESCO/SNGPL bill scraping (`scrapers/`)

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run [`../supabase/migrations/001_schema.sql`](../supabase/migrations/001_schema.sql) in the SQL editor
3. Create a user under **Authentication → Users**
4. Copy **Project URL**, **anon key**, and **service role key**

### 2. Environment

```bash
cp .env.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Optional (trigger scrape from UI):

```
GITHUB_TOKEN=
GITHUB_REPO=your-org/Tenants
```

### 3. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 and sign in with your Supabase user email/password.

## Mobile app (`tenants.mobile/`)

The Expo app uses the same Supabase project for login and calls this app's `/api/*` routes with a Bearer token. See [`../tenants.mobile/README.md`](../tenants.mobile/README.md).

## Deploy to Vercel

1. Import this repo; set **Root Directory** to `tenants-web`
2. Add the same env vars in Vercel → Settings → Environment Variables
3. Deploy

GitHub Actions secrets (repo settings → Secrets):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Bill scraping

Scheduled workflows run on the 5th (LESCO) and 18th (SNGPL) each month. Manual run:

**Actions → Scrape utility bills → Run workflow**

Or from the app (if `GITHUB_TOKEN` + `GITHUB_REPO` are set on Vercel).

## Migrating from SQL Server

See [`../scripts/migrate-from-sqlserver/README.md`](../scripts/migrate-from-sqlserver/README.md).

## Legacy stack

The original ASP.NET + SQL Server app remains in `Tenants.Server/` and `tenants.client/` for reference during migration.
