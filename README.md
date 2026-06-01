# Tenants

A property and tenant management web app with automatic utility bill scraping for **LESCO** (electricity) and **SNGPL** (gas) in Pakistan.

## Recommended deployment (free tier)

The active stack lives in **`tenants-web/`** — Next.js + Supabase + Vercel + GitHub Actions.

| Layer | Technology |
|-------|------------|
| Web + API | Next.js 16, TypeScript, Bootstrap 5 |
| Database / Auth | Supabase (Postgres + Auth) |
| Hosting | Vercel Hobby (free) |
| Bill scraping | Python scripts in `scrapers/`, run on GitHub Actions cron |

**Quick start:** see [tenants-web/README.md](tenants-web/README.md).

**Database schema:** [supabase/migrations/001_schema.sql](supabase/migrations/001_schema.sql).

**Migrate from SQL Server:** [scripts/migrate-from-sqlserver/README.md](scripts/migrate-from-sqlserver/README.md).

## Features

- **Properties & floors** – Manage properties and their floors
- **Tenants & occupancies** – Track tenants, move-in/out, and rent
- **Utility connections** – Link electricity (LESCO) and gas (SNGPL) accounts to properties
- **Bill scraping** – Automatically fetch and store monthly bills (GitHub Actions)
- **Bill summary** – View bills by property, mark as paid, download HTML snapshots
- **Authentication** – Supabase email/password login

## Legacy stack (reference)

The original implementation remains for reference:

| Layer | Technology |
|-------|------------|
| Backend | ASP.NET Core 10, EF Core, SQL Server |
| Frontend | React 19, Vite (`tenants.client/`) |
| Mobile | Expo (`tenants.mobile/`) |
| Scraping | Python invoked by ASP.NET host |

Local development of the legacy app:

```bash
dotnet run --project Tenants.Server
```

See [Tenants.Server/BILLS_SCRAPING.md](Tenants.Server/BILLS_SCRAPING.md) for legacy scraper setup.

## Project structure

```
Tenants/
├── tenants-web/              # Next.js app (deploy this)
├── supabase/migrations/      # Postgres schema
├── scrapers/                 # LESCO/SNGPL Python + sync_bills.py
├── .github/workflows/        # Scheduled bill scraping
├── scripts/migrate-from-sqlserver/
├── Tenants.Server/           # Legacy ASP.NET API
├── tenants.client/           # Legacy Vite React SPA
├── tenants.mobile/           # Expo mobile app (Supabase auth + tenants-web API)
```

## Bill scraping schedule

| Utility | Field | Script | Schedule (UTC) |
|---------|-------|--------|----------------|
| Electricity (LESCO) | 14-digit Reference Number | `lesco_scraper.py` | 5th of month, 06:00 |
| Gas (SNGPL) | 11-digit Consumer Number | `sngpl_scraper.py` | 18th of month, 06:00 |

Manual run: GitHub **Actions → Scrape utility bills → Run workflow**.

## License

Private / All rights reserved.
