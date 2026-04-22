param(
  [string]$WorkspacePath = ".",
  [string]$OutputDir = "backups"
)

$ErrorActionPreference = "Stop"

Push-Location $WorkspacePath
try {
  $backupPath = Join-Path (Get-Location) $OutputDir
  if (-not (Test-Path $backupPath)) {
    New-Item -ItemType Directory -Path $backupPath | Out-Null
  }

  $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $fileName = "real_estate_crm-$timestamp.sql"
  $fullPath = Join-Path $backupPath $fileName

  docker compose -f docker-compose.deploy.yml exec -T postgres sh -c "pg_dump -U crm -d real_estate_crm" | Out-File -FilePath $fullPath -Encoding utf8

  Write-Host "Backup created: $fullPath" -ForegroundColor Green
}
finally {
  Pop-Location
}
