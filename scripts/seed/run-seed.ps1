#Requires -Version 5.1
<#
.SYNOPSIS
  Applies scripts/seed/tenants-data.json to Supabase/Postgres via seed_tenants_from_json().

.DESCRIPTION
  1. Ensures seed_tenants_from_json exists (runs seed-from-json.sql)
  2. Passes tenants-data.json to the function

  Set DATABASE_URL to your Postgres connection string, e.g. Supabase direct connection:
    postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

.EXAMPLE
  $env:DATABASE_URL = "postgresql://postgres:secret@db.xxx.supabase.co:5432/postgres"
  .\run-seed.ps1
#>
param(
    [string]$DatabaseUrl = $env:DATABASE_URL,
    [string]$JsonPath = "$PSScriptRoot\tenants-data.json",
    [switch]$SkipFunctionInstall
)

$ErrorActionPreference = "Stop"

if (-not $DatabaseUrl) {
    Write-Error "Set DATABASE_URL or pass -DatabaseUrl (Supabase Postgres connection string)."
}

if (-not (Test-Path $JsonPath)) {
    Write-Error "JSON file not found: $JsonPath"
}

function Invoke-Psql {
    param([string]$Sql)
    $Sql | psql $DatabaseUrl -v ON_ERROR_STOP=1 -q
    if ($LASTEXITCODE -ne 0) {
        throw "psql failed with exit code $LASTEXITCODE"
    }
}

if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Error "psql not found on PATH and Node.js is not installed. Install PostgreSQL client tools, install Node.js, or use Supabase SQL editor (see README.md)."
    }

    Write-Host "psql not found; using Node.js..."
    if (-not (Test-Path "$PSScriptRoot\node_modules\pg")) {
        Write-Host "Installing pg (one-time)..."
        npm install --prefix $PSScriptRoot --omit=dev
        if ($LASTEXITCODE -ne 0) {
            throw "npm install failed"
        }
    }

    $env:DATABASE_URL = $DatabaseUrl
    $nodeArgs = @("$PSScriptRoot\run-seed.mjs", "--json", $JsonPath)
    if ($SkipFunctionInstall) {
        $nodeArgs += "--skip-function-install"
    }

    node @nodeArgs
    if ($LASTEXITCODE -ne 0) {
        throw "Seed failed with exit code $LASTEXITCODE"
    }
    exit 0
}

if (-not $SkipFunctionInstall) {
    Write-Host "Installing seed_tenants_from_json..."
    Get-Content "$PSScriptRoot\seed-from-json.sql" -Raw | psql $DatabaseUrl -v ON_ERROR_STOP=1 -q
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to install seed function"
    }
}

Write-Host "Loading $JsonPath..."
$json = Get-Content -Raw -Encoding UTF8 $JsonPath
$jsonSingleLine = ($json -replace '\s+', ' ').Trim()
$escaped = $jsonSingleLine -replace "'", "''"

$sql = @"
SELECT *
FROM seed_tenants_from_json('$escaped'::jsonb);
"@

Write-Host "Seeding database..."
Invoke-Psql -Sql $sql
Write-Host "Done. Verify row counts in Supabase dashboard."
