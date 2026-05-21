# Export SQL Server data to JSON for Supabase import.
# Requires: sqlcmd, connection to your Tenants database.
#
# Usage:
#   .\export.ps1 -Server "localhost\SQLEXPRESS" -Database "Tenants"

param(
    [string]$Server = "localhost\SQLEXPRESS",
    [string]$Database = "Tenants",
    [string]$OutDir = "$PSScriptRoot\export"
)

$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$tables = @(
    "Properties",
    "Floors",
    "Tenants",
    "TenantOccupancies",
    "UtilityConnections",
    "MonthlyBills",
    "RentPayments",
    "RentIncreaseRules"
)

foreach ($table in $tables) {
    $outFile = Join-Path $OutDir "$table.json"
    Write-Host "Exporting $table..."
    $query = "SET NOCOUNT ON; SELECT * FROM [$table] FOR JSON PATH"
    sqlcmd -S $Server -d $Database -E -Q $query -h -1 -W -o $outFile
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Failed to export $table"
    }
}

Write-Host "Export complete: $OutDir"
Write-Host "Create a Supabase user via dashboard, then run import_to_supabase.py"
