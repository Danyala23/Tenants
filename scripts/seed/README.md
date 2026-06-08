# Seed tenant & utility data

One-shot load of properties, floors, tenants, occupancies, and utility connections (LESCO reference numbers + SNGPL consumer numbers) from `tenants-data.json`.

## Files

| File | Purpose |
|------|---------|
| `tenants-data.json` | Source of truth — edit this when tenants or bill refs change |
| `seed-from-json.sql` | Defines `seed_tenants_from_json(jsonb)` in Postgres |
| `run-seed.ps1` | Loads JSON and runs the seed function (Windows / local) |

## Prerequisites

- Postgres schema applied: `supabase/migrations/001_schema.sql`
- `psql` on PATH
- `DATABASE_URL` — Supabase **direct** Postgres connection string (Project Settings → Database)

## Run

```powershell
cd scripts/seed
$env:DATABASE_URL = "postgresql://postgres:YOUR_PASSWORD@db.YOUR_REF.supabase.co:5432/postgres"
.\run-seed.ps1
```

Re-running is safe for seeded properties: existing rows with matching `house_number` are deleted and recreated (cascade removes floors, occupancies, utilities, bills, and payments for those properties).

## Supabase SQL editor (no psql)

1. Run `seed-from-json.sql` once in the SQL editor.
2. Copy the contents of `tenants-data.json` and execute:

```sql
SELECT * FROM seed_tenants_from_json('<paste JSON here>'::jsonb);
```

## Field mapping (utilities)

| Bill source column | DB column | Utility |
|--------------------|-----------|---------|
| Reference | `reference_number` | Electricity (LESCO) |
| Gas | `consumer_number` | Gas (SNGPL) |

`CustomerId` and PTCL values are ignored. Shared gas (e.g. 88/2-C) is stored once at property level in `sharedUtilities`.

## Properties in seed

| House | Size (marla) | Notes |
|-------|--------------|-------|
| 8-A | 6 | Commercial plaza — 5 units; Haneef basement+ground = one rent on Ground |
| 270-A | 12 | Upper / Lower |
| 105-D | 8 | Self-occupied — tenant `Me`, rent 0; shared gas at property level |
| 88/2-C | 8 | Shared gas connection |
| 195-D | 8 | Upper rented (Naeem); shared gas at property level |
