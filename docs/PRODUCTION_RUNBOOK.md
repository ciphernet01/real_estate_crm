# Production Runbook

## 1) Deploy latest build

1. `docker compose -f docker-compose.deploy.yml up --build -d`
2. Verify services:
   - `http://localhost:4000/api/health`
   - `http://localhost:4000/api/health/deep`
   - `http://localhost:5173`

## 2) Run UAT smoke checks

- `powershell -ExecutionPolicy Bypass -File .\\scripts\\uat-smoke.ps1`

## 3) Take database backup

- `powershell -ExecutionPolicy Bypass -File .\\scripts\\db-backup.ps1`

## 4) Restore database (if needed)

- `powershell -ExecutionPolicy Bypass -File .\\scripts\\db-restore.ps1 -BackupFile .\\backups\\<file>.sql`

## 5) Rollback application stack

- `powershell -ExecutionPolicy Bypass -File .\\scripts\\rollback-stack.ps1`
- Optional with DB restore:
  - `powershell -ExecutionPolicy Bypass -File .\\scripts\\rollback-stack.ps1 -RestoreBackupFile .\\backups\\<file>.sql`

## 6) Post-deploy checklist

- Login as admin succeeds
- Leads/Properties/Clients/Deals pages load
- Reports overview and exports work
- Notifications dispatch endpoint returns 200
