# SQL Server → Supabase migration

## 1. Export from SQL Server

```powershell
cd scripts/migrate-from-sqlserver
.\export.ps1 -Server "localhost\SQLEXPRESS" -Database "Tenants"
```

Produces `export/*.json` per table.

## 2. Create Supabase project

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/migrations/001_schema.sql` in the SQL editor
3. Create an auth user (Authentication → Users → Add user) for login

## 3. Import

```bash
pip install supabase
set SUPABASE_URL=https://xxx.supabase.co
set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
python import_to_supabase.py --dir export
```

## 4. Validate

Compare row counts:

| Table | SQL Server | Supabase |
|-------|------------|----------|
| properties | | |
| floors | | |
| tenants | | |
| tenant_occupancies | | |
| monthly_bills | | |

Legacy ASP.NET Identity users are **not** migrated — create a new Supabase Auth user.
