# 01 — Repository Discovery & System Map (Read‑Only)

**Mode: READ‑ONLY. Make NO code changes. Output findings in chat only.**

## Goal

Build a **system map** so later steps can target the correct services and layers:
- backend services (API, jobs, workers)
- frontend apps (admin console, teacher UI, student UI)
- integration connectors (SIS/OneRoster, LTI, SSO/IdP)
- data stores (DB schemas, queues, caches)
- infra/config (Terraform/Helm/K8s, env vars, feature flags)

This map is the foundation for the entire assessment.

---

## Step A — Quick repo inventory (safe commands)

Perform a high-level scan (read-only) to identify:
- languages and frameworks
- monolith vs microservices
- directories: `apps/`, `services/`, `packages/`, `backend/`, `frontend/`, `api/`, `web/`, `docs/`, `infra/`, `deploy/`
- CI/CD pipelines and environment configuration

**Suggested artifacts to look for**
- `package.json`, `pnpm-workspace.yaml`, `turbo.json`
- `requirements.txt`, `pyproject.toml`
- `go.mod`
- `pom.xml`, `build.gradle`
- `Dockerfile*`, `docker-compose*.yml`
- `helm/`, `k8s/`, `terraform/`
- `openapi.yaml`, `swagger.*`
- `.env.example`, `config/*`, `settings/*`

---

## Step B — Identify domain models & key concepts

Search for the core entities:
- Organization hierarchy: `district`, `school`, `orgUnit`, `tenant`, `subaccount`
- Academic structure: `term`, `academicYear`, `gradingPeriod`, `course`, `section`, `class`
- People and roles: `student`, `teacher`, `admin`, `guardian`, `observer`, `support`
- Membership: `enrollment`, `roster`, `membership`, `sectionEnrollment`
- Content: `module`, `assignment`, `resource`, `file`, `template`, `blueprint`, `commons`, `library`
- Integrations: `oneroster`, `sis`, `lti`, `nrps`, `ags`, `deepLink`, `saml`, `oidc`, `clever`
- Accountability: `audit`, `access log`, `event`, `dataset`, `analytics`

**Output**
- List the **top 10–20 most important domain terms** that appear in code (exact class/table names if possible).
- Identify the “source of truth” for each: DB tables, services, or external systems.

---

## Step C — Produce the “System Map” (required format)

In chat, produce:

### 1) Service map table

Fill this table:

| Component | Path(s) | Tech | Purpose | Key entrypoints |
|---|---|---|---|---|
| Backend API |  |  |  |  |
| Background jobs/worker |  |  |  |  |
| Frontend (Admin) |  |  |  |  |
| Frontend (Teacher/Student) |  |  |  |  |
| Auth/SSO module |  |  |  |  |
| SIS/OneRoster connector |  |  |  |  |
| LTI module |  |  |  |  |
| Analytics/reporting |  |  |  |  |
| Logging/audit subsystem |  |  |  |  |
| Infra/config/feature flags |  |  |  |  |

If the repo has more services, add rows.

### 2) Data stores and integrations list

List:
- primary DB type (Postgres/MySQL/etc.), schema/migrations location
- cache (Redis/etc.), queues (SQS/RabbitMQ/Kafka), object storage (S3/etc.)
- identity providers supported (SAML/OIDC/etc.)
- SIS vendors or connectors (if referenced)
- third-party tools integration framework (LTI/etc.)

### 3) “Where to look” index (for later steps)

Create a short index like:
- Org hierarchy models → `...`
- RBAC enforcement middleware → `...`
- SIS sync jobs → `...`
- LTI 1.3 handlers → `...`
- Admin UI permissions gating → `...`
- Audit logging library → `...`

---

## Step D — Confirm read-only stance

Before continuing:
- If `git` exists, run `git status` and confirm clean.
- If not, just state: “No files were modified.”

---

## Evidence to collect (keep for later steps)

Capture (as paths/notes, no copying required):
- authentication config and middleware
- API route definitions
- job scheduler definitions
- database migration folders
- analytics dataset/export modules
- audit log event definitions

---

## Output checklist (must complete)

- [ ] Service map table completed
- [ ] Data stores/integrations list completed
- [ ] “Where to look” index completed
- [ ] Read-only confirmation stated

Proceed to `02_ORG_HIERARCHY_AND_MULTITENANCY.md`.
