# Final Handoff Checklist

## Delivered modules

- Lead Management
- Property Management
- Client Management
- Deal / Transaction Management
- Communication & Follow-ups
- Agent / User Management (RBAC)
- Reports & Analytics (CSV/PDF exports)
- Integration APIs (lead webhooks + portal sync)

## Deployment status

- Docker deployment compose available
- CI pipeline includes backend tests, frontend build, and Docker smoke gate
- UAT smoke scripts for PowerShell and Bash

## Operations assets

- DB backup script: `scripts/db-backup.ps1`
- DB restore script: `scripts/db-restore.ps1`
- Rollback script: `scripts/rollback-stack.ps1`
- Runbook: `docs/PRODUCTION_RUNBOOK.md`

## Credentials for local seeded environment

- Email: `admin@crm.local`
- Password: `Admin@123`
