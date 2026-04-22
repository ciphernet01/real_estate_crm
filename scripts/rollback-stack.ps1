param(
  [string]$WorkspacePath = ".",
  [string]$RestoreBackupFile = ""
)

$ErrorActionPreference = "Stop"

Push-Location $WorkspacePath
try {
  Write-Host "Stopping current stack..." -ForegroundColor Yellow
  docker compose -f docker-compose.deploy.yml down

  Write-Host "Starting previous local images without rebuild..." -ForegroundColor Yellow
  docker compose -f docker-compose.deploy.yml up -d

  if ($RestoreBackupFile) {
    Write-Host "Restoring database from backup..." -ForegroundColor Yellow
    powershell -ExecutionPolicy Bypass -File .\scripts\db-restore.ps1 -WorkspacePath (Get-Location).Path -BackupFile $RestoreBackupFile
  }

  $health = Invoke-RestMethod -Method Get -Uri "http://localhost:4000/api/health"
  if (-not $health.ok) {
    throw "Rollback health check failed"
  }

  Write-Host "Rollback completed and health check passed." -ForegroundColor Green
}
finally {
  Pop-Location
}
