# Release Tag Checklist

Use this checklist right before creating a production release tag.

## 1) Code & CI status

- Pull latest `main`
- Confirm CI is green (backend tests, frontend build, Docker smoke gate)
- Confirm no unresolved issues in release scope

## 2) Runtime validation

- Start stack: `docker compose -f docker-compose.deploy.yml up --build -d`
- Run UAT: `powershell -ExecutionPolicy Bypass -File .\scripts\uat-smoke.ps1`
- Confirm health:
  - `http://localhost:4000/api/health`
  - `http://localhost:4000/api/health/deep`

## 3) Data safety

- Create DB backup: `powershell -ExecutionPolicy Bypass -File .\scripts\db-backup.ps1`
- Verify backup file exists under `backups/`

## 4) Release metadata

- Prepare release notes (features, fixes, known issues)
- Decide semantic version (example: `v1.0.0`)
- Ensure migration/rollback notes are included

## 5) Tag & publish

- Create annotated tag:
  - `git tag -a vX.Y.Z -m "Release vX.Y.Z"`
- Push tag:
  - `git push origin vX.Y.Z`

## 6) Post-tag checks

- Verify deployment pipeline triggered
- Smoke-test production endpoints
- Announce release with links to runbook and rollback steps

## 7) Rollback trigger criteria

Rollback immediately if any of these occur after deployment:

- `/api/health/deep` fails
- Authentication failures spike
- Core CRUD endpoints erroring consistently
- Data integrity concern detected

Rollback command:

- `powershell -ExecutionPolicy Bypass -File .\scripts\rollback-stack.ps1`
