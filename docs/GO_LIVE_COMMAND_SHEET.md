# Go-Live Command Sheet

Fast command sheet for deployment day.

## A) Build and start services

- `docker compose -f docker-compose.deploy.yml up --build -d`

## B) Verify service status

- `docker compose -f docker-compose.deploy.yml ps`
- `curl http://localhost:4000/api/health`
- `curl http://localhost:4000/api/health/deep`

## C) Initialize database (first-time environment)

- `docker compose -f docker-compose.deploy.yml exec backend npx prisma db push`
- `docker compose -f docker-compose.deploy.yml exec backend npm run prisma:seed`

## D) Run smoke tests

PowerShell:

- `powershell -ExecutionPolicy Bypass -File .\scripts\uat-smoke.ps1`

Bash:

- `bash ./scripts/uat-smoke.sh`

## E) Create backup before release

- `powershell -ExecutionPolicy Bypass -File .\scripts\db-backup.ps1`

## F) Tail logs during rollout

- `docker compose -f docker-compose.deploy.yml logs backend --tail 200 -f`
- `docker compose -f docker-compose.deploy.yml logs frontend --tail 200 -f`

## G) Stop / restart stack

- Stop: `docker compose -f docker-compose.deploy.yml down`
- Restart: `docker compose -f docker-compose.deploy.yml up -d`

## H) Restore database (if needed)

- `powershell -ExecutionPolicy Bypass -File .\scripts\db-restore.ps1 -BackupFile .\backups\<file>.sql`

## I) Rollback

- `powershell -ExecutionPolicy Bypass -File .\scripts\rollback-stack.ps1`
- with restore: `powershell -ExecutionPolicy Bypass -File .\scripts\rollback-stack.ps1 -RestoreBackupFile .\backups\<file>.sql`

## J) Key URLs

- Frontend: `http://localhost:5173`
- API health: `http://localhost:4000/api/health`
- API deep health: `http://localhost:4000/api/health/deep`
