# Real Estate CRM

Monorepo scaffold for a real estate CRM with:

- Backend: Node.js + Express + Prisma + PostgreSQL
- Frontend: React + Vite
- Docker Compose for local development

## Structure

- backend/ — API, database schema, auth, modules
- frontend/ — dashboard UI and module pages
- docker-compose.yml — PostgreSQL + optional services

## Current scope

This scaffold includes the foundation for:

- Lead management
- Property management
- Client management
- Deal management
- Authentication and RBAC
- Reports dashboard shell

## Starter login for local development

After running the seed script, use:

- Email: admin@crm.local
- Password: Admin@123

## Quick start

1) Local database

- Run: docker compose up -d

2) Backend

- Copy: backend/.env.example -> backend/.env
- Install: cd backend && npm install
- Prisma setup: npm run prisma:generate && npm run prisma:migrate && npm run prisma:seed
- Start API: npm run dev

3) Frontend

- Install: cd frontend && npm install
- Start app: npm run dev

## Testing

- Backend tests: cd backend && npm test

## Lead module APIs (implemented)

- POST /api/leads/capture (public website capture)
- GET /api/leads (auth, list leads)
- GET /api/leads/:id (auth, lead details)
- POST /api/leads (auth, create with auto/manual assignment)
- PATCH /api/leads/:id (auth, status workflow + updates)
- DELETE /api/leads/:id (auth)
- GET /api/leads/reminders/upcoming?days=7 (auth)
- POST /api/leads/:id/reminders (auth)
- PATCH /api/leads/reminders/:reminderId/complete (auth)
- GET /api/auth/agents (auth, assignable users)

## Property module APIs (implemented)

- GET /api/properties (auth, supports search, city, type, status, minPrice, maxPrice)
- GET /api/properties/:id (auth)
- POST /api/properties (auth, create listing)
- PATCH /api/properties/:id (auth, update listing)
- DELETE /api/properties/:id (auth)
- POST /api/properties/upload (auth, multipart image upload field name: image)
- Uploaded images are served from /uploads/properties/*

## Client module APIs (implemented)

- GET /api/clients (auth, list clients with linked lead/deal counters)
- GET /api/clients/:id (auth, client details with linked leads and interactions)
- POST /api/clients (auth, create buyer/seller profile)
- PATCH /api/clients/:id (auth, update profile)
- DELETE /api/clients/:id (auth)
- GET /api/clients/:id/interactions (auth)
- POST /api/clients/:id/interactions (auth, interaction logging)
- POST /api/clients/:id/link-lead (auth, body: leadId)
- DELETE /api/clients/:id/link-lead/:leadId (auth)
- GET /api/clients/:id/deals (auth, deals related via linked leads)

## Deal module APIs (implemented)

- GET /api/deals (auth, list deals with lead/property/agent/documents)
- GET /api/deals/:id (auth)
- POST /api/deals (auth, commission auto-calculation supported with commissionRate)
- PATCH /api/deals/:id (auth, stage workflow transition rules enforced)
- DELETE /api/deals/:id (auth)
- POST /api/deals/:id/documents (auth, multipart upload field name: document)
- GET /api/deals/reports/summary (auth, stage counts, conversion, commission totals)
- Uploaded deal documents are served from /uploads/deals/*

## Communication & follow-up APIs (implemented)

- GET /api/communications/timeline?limit=100&leadId=... (auth activity timeline)
- POST /api/communications/activity (auth, call/SMS/email logging)
- POST /api/communications/followups/schedule (auth, reminder scheduling)
- GET /api/communications/notifications/pending?windowHours=24 (auth, pending tasks)
- POST /api/communications/notifications/dispatch (auth, dispatch due reminders via webhook providers)

### Notification provider environment variables

- SMS_WEBHOOK_URL
- EMAIL_WEBHOOK_URL
- NOTIFICATION_FROM

## Agent/User management APIs (implemented)

### User & RBAC

- GET /api/users (auth, manager/admin)
- POST /api/users (auth, admin)
- PATCH /api/users/:id/role (auth, admin)
- DELETE /api/users/:id (auth, admin)

### Agent performance & tasks

- GET /api/agents/performance (auth, manager/admin)
- GET /api/agents/tasks?mine=true (auth, task list for current user)
- GET /api/agents/tasks?agentId=... (auth, filtered tasks)
- POST /api/agents/tasks/assign (auth, manager/admin; assigns lead + creates reminder task)

## Reports & analytics APIs (implemented)

- GET /api/reports/overview (auth, KPI summary for leads/deals/revenue/agents)
- GET /api/reports/export/overview.csv (auth, manager/admin export)
- GET /api/reports/export/overview.pdf (auth, manager/admin export)

## Integration APIs (implemented)

- GET /api/integrations/status (auth, manager/admin integration readiness)
- POST /api/integrations/webhooks/lead (public lead capture webhook)
- POST /api/integrations/portal-sync/property (auth, manager/admin, portal sync webhook/dry-run)

### Integration environment variables

- INTEGRATION_WEBHOOK_SECRET
- PORTAL_SYNC_WEBHOOK_URL

## Deployment (Docker)

- Start full stack containers: docker compose -f docker-compose.deploy.yml up --build -d
- Frontend: http://localhost:5173
- Backend health: http://localhost:4000/api/health

## Mobile + accessibility hardening

- Skip link and keyboard focus visibility added across the dashboard layout
- Responsive table behavior improved for narrow screens
- Reduced-motion preferences respected

## UAT smoke automation

- Run automated smoke checks: `powershell -ExecutionPolicy Bypass -File .\scripts\uat-smoke.ps1`
- Optional params:
	- `-ApiBase http://localhost:4000/api`
	- `-Email admin@crm.local`
	- `-Password Admin@123`

### Linux/macOS / CI variant

- `bash ./scripts/uat-smoke.sh`

## Production readiness assets

- DB backup: `powershell -ExecutionPolicy Bypass -File .\scripts\db-backup.ps1`
- DB restore: `powershell -ExecutionPolicy Bypass -File .\scripts\db-restore.ps1 -BackupFile .\backups\<file>.sql`
- Rollback stack: `powershell -ExecutionPolicy Bypass -File .\scripts\rollback-stack.ps1`
- Runbook: [docs/PRODUCTION_RUNBOOK.md](docs/PRODUCTION_RUNBOOK.md)
- Handoff checklist: [docs/FINAL_HANDOFF.md](docs/FINAL_HANDOFF.md)
- Release tag checklist: [docs/RELEASE_TAG_CHECKLIST.md](docs/RELEASE_TAG_CHECKLIST.md)
- Go-live command sheet: [docs/GO_LIVE_COMMAND_SHEET.md](docs/GO_LIVE_COMMAND_SHEET.md)

