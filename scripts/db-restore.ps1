param(
  [string]$WorkspacePath = ".",
  [Parameter(Mandatory = $true)]
  [string]$BackupFile
)

$ErrorActionPreference = "Stop"

Push-Location $WorkspacePath
try {
  if (-not (Test-Path $BackupFile)) {
    throw "Backup file not found: $BackupFile"
  }

  $sql = Get-Content -Raw -Path $BackupFile
  $sql | docker compose -f docker-compose.deploy.yml exec -T postgres sh -c "psql -U crm -d real_estate_crm"

  Write-Host "Restore completed from: $BackupFile" -ForegroundColor Green
}
finally {
  Pop-Location
}
