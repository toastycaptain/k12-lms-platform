# CODEX Batch 7 — Backend Master Execution

**Date:** 2026-02-17
**Total Tasks:** 7 (backend only — frontend deferred)
**Estimated Effort:** 40–52 hours

---

## Pre-Flight

Before starting any task, confirm a green baseline:

```bash
cd apps/core && bundle exec rspec
cd apps/core && bundle exec rubocop
cd apps/web && npm run typecheck && npm run lint
cd apps/ai-gateway && pytest
```

If anything fails, fix it first. Do not start Batch 7 on a broken codebase.

---

## Execution Rules

**Follow these rules for every task. No exceptions.**

1. **Read the spec file completely** before writing any code.
2. **Create a feature branch** from an up-to-date main:
   ```bash
   git checkout main && git pull origin main
   git checkout -b <branch-name>
   ```
3. **Execute every item** in the spec — models, migrations, services, controllers, policies, serializers, jobs, and tests.
4. **Run the full test suite** after completing the task:
   ```bash
   cd apps/core && bundle exec rspec
   cd apps/core && bundle exec rubocop
   cd apps/web && npm run typecheck
   cd apps/web && npm run lint
   cd apps/ai-gateway && pytest  # only if AI gateway files were modified
   ```
5. **Fix all failures.** Do not proceed with a failing test or lint error.
6. **Commit and push:**
   ```bash
   git add -A
   git commit -m "<commit message from task below>"
   git push origin <branch-name>
   ```
7. **Merge to main:**
   ```bash
   git checkout main
   git merge <branch-name>
   git push origin main
   ```
8. **Verify main is green** after merge. If not, fix before proceeding.
9. **Move to the next task.**

---

## Task Sequence

Execute tasks in this exact order. Do not skip ahead. Do not start a task until its dependencies are merged to main.

```
Task 01  Security Audit       [no deps]
Task 02  Database Scaling      [no deps]
  |
  +---> Task 03  Backup & Restore    [depends on 02]
  +---> Task 04  Monitoring & Alerting [depends on 02]
            |
            +---> Task 07  Deploy Infrastructure [depends on 04]

Task 05  Tenant Provisioning   [depends on 01, 03]
Task 06  AI Safety Depth       [no deps]
```

Tasks 01, 02, and 06 have no dependencies and may run in any order (or parallel if multiple agents are available). Tasks 03 and 04 require Task 02. Task 05 requires Tasks 01 and 03. Task 07 requires Task 04.

**Recommended serial order (for a single agent):**

01 → 02 → 03 → 04 → 05 → 06 → 07

---

### Task 01: Security Audit

| Field | Value |
|-------|-------|
| Spec File | `spec/CODEX_TASK_01_SECURITY_AUDIT.md` |
| Branch | `batch7/01-security-audit` |
| Depends On | None |
| Commit Message | `Batch 7 Task 01: Security audit — RLS verification, CSP, SSRF prevention, file upload validation, rate limiting expansion` |

**Summary:** Run Brakeman and bundle-audit. Verify RLS on all Batch 4–6 tables. Add CSP headers, cookie security, file upload validation (AttachmentValidatable), SSRF prevention (SafeUrlValidator), and rate limiting for new endpoints.

**After completing this task:**
```bash
cd apps/core && bundle exec rspec && bundle exec rubocop
git add -A && git commit -m "Batch 7 Task 01: Security audit — RLS verification, CSP, SSRF prevention, file upload validation, rate limiting expansion"
git push origin batch7/01-security-audit
git checkout main && git merge batch7/01-security-audit && git push origin main
```

---

### Task 02: Database Scaling

| Field | Value |
|-------|-------|
| Spec File | `spec/CODEX_TASK_02_DATABASE_SCALING.md` |
| Branch | `batch7/02-database-scaling` |
| Depends On | None |
| Commit Message | `Batch 7 Task 02: Database scaling — counter caches, materialized views, N+1 fixes, indexes, pg_stat_statements` |

**Summary:** Add Bullet gem for N+1 detection. Add `.includes()` to all controller index actions. Create counter cache columns (11 across 7 tables) and backfill. Create materialized views for analytics with hourly refresh job. Add composite indexes. Enable pg_stat_statements with SlowQueryService. Configure connection pooling.

**After completing this task:**
```bash
cd apps/core && bundle exec rspec && bundle exec rubocop
git add -A && git commit -m "Batch 7 Task 02: Database scaling — counter caches, materialized views, N+1 fixes, indexes, pg_stat_statements"
git push origin batch7/02-database-scaling
git checkout main && git merge batch7/02-database-scaling && git push origin main
```

---

### Task 03: Backup & Restore

| Field | Value |
|-------|-------|
| Spec File | `spec/CODEX_TASK_03_BACKUP_RESTORE.md` |
| Branch | `batch7/03-backup-restore` |
| Depends On | **Task 02** |
| Commit Message | `Batch 7 Task 03: Backup automation — DatabaseBackupJob, BackupVerificationJob, backup API, daily schedule` |

**Summary:** Create BackupRecord model (NOT tenant-scoped). Create DatabaseBackupJob (pg_dump → gzip → S3). Create BackupVerificationJob (restore to temp DB, verify row counts). Create backup admin API. Schedule daily backup at 2 AM.

**After completing this task:**
```bash
cd apps/core && bundle exec rspec && bundle exec rubocop
git add -A && git commit -m "Batch 7 Task 03: Backup automation — DatabaseBackupJob, BackupVerificationJob, backup API, daily schedule"
git push origin batch7/03-backup-restore
git checkout main && git merge batch7/03-backup-restore && git push origin main
```

---

### Task 04: Monitoring & Alerting

| Field | Value |
|-------|-------|
| Spec File | `spec/CODEX_TASK_04_MONITORING_ALERTING.md` |
| Branch | `batch7/04-monitoring-alerting` |
| Depends On | **Task 02** |
| Commit Message | `Batch 7 Task 04: Monitoring — SystemHealthService, AlertConfiguration, AlertEvaluationJob, SlackNotifier, health API` |

**Summary:** Create AlertConfiguration model (optionally tenant-scoped). Create SystemHealthService checking DB, Redis, Sidekiq, storage, AI gateway. Create AlertEvaluationJob (every 5 min). Create UptimeMonitorJob (every 2 min). Create SlackNotifier. Create health and alert configuration APIs. Seed default alert thresholds.

**After completing this task:**
```bash
cd apps/core && bundle exec rspec && bundle exec rubocop
git add -A && git commit -m "Batch 7 Task 04: Monitoring — SystemHealthService, AlertConfiguration, AlertEvaluationJob, SlackNotifier, health API"
git push origin batch7/04-monitoring-alerting
git checkout main && git merge batch7/04-monitoring-alerting && git push origin main
```

---

### Task 05: Tenant Provisioning

| Field | Value |
|-------|-------|
| Spec File | `spec/CODEX_TASK_05_TENANT_PROVISIONING.md` |
| Branch | `batch7/05-tenant-provisioning` |
| Depends On | **Task 01**, **Task 03** |
| Commit Message | `Batch 7 Task 05: Tenant provisioning — TenantProvisioningService, OnboardingChecklistService, DataImportService, provisioning API` |

**Summary:** Create TenantProvisioningService (tenant + school + 5 roles + permissions + admin + academic year + AI policies in one transaction). Create OnboardingChecklistService (10 items, completion %). Create DataImportService (CSV users, courses, enrollments). Create provisioning API with bulk create. Create branding API.

**After completing this task:**
```bash
cd apps/core && bundle exec rspec && bundle exec rubocop
git add -A && git commit -m "Batch 7 Task 05: Tenant provisioning — TenantProvisioningService, OnboardingChecklistService, DataImportService, provisioning API"
git push origin batch7/05-tenant-provisioning
git checkout main && git merge batch7/05-tenant-provisioning && git push origin main
```

---

### Task 06: AI Safety Depth

| Field | Value |
|-------|-------|
| Spec File | `spec/CODEX_TASK_06_AI_SAFETY.md` |
| Branch | `batch7/06-ai-safety` |
| Depends On | None |
| Commit Message | `Batch 7 Task 06: AI safety — SafetyPipeline, PIIFilter, ContentClassifier, per-tenant safety levels, safety events API` |

**Summary:** This task spans TWO apps. In `apps/ai-gateway`: refactor filters into SafetyPipeline, create PIIFilter (detect + redact), create ContentClassifier (weighted keywords, 3 safety levels). In `apps/core`: create safety events/stats/config API, pass safety_level in AI gateway context.

**After completing this task:**
```bash
cd apps/ai-gateway && pytest
cd apps/core && bundle exec rspec && bundle exec rubocop
git add -A && git commit -m "Batch 7 Task 06: AI safety — SafetyPipeline, PIIFilter, ContentClassifier, per-tenant safety levels, safety events API"
git push origin batch7/06-ai-safety
git checkout main && git merge batch7/06-ai-safety && git push origin main
```

---

### Task 07: Deploy Infrastructure

| Field | Value |
|-------|-------|
| Spec File | `spec/CODEX_TASK_07_DEPLOY_INFRASTRUCTURE.md` |
| Branch | `batch7/07-deploy-infrastructure` |
| Depends On | **Task 04** |
| Commit Message | `Batch 7 Task 07: Deploy infrastructure — SafeMigration, DeployWindowService, FeatureFlag, deploy/rollback scripts, CI pipeline` |

**Summary:** Create SafeMigration module (prevents unsafe migration patterns). Create DeployWindowService (blocks deploys during school hours). Create FeatureFlag model (3-layer lookup: tenant > global > hardcoded). Create deploy.sh and rollback.sh scripts. Create deploy CI pipeline with rollback-on-failure. Create feature flag and deploy window APIs.

**After completing this task:**
```bash
cd apps/core && bundle exec rspec && bundle exec rubocop
git add -A && git commit -m "Batch 7 Task 07: Deploy infrastructure — SafeMigration, DeployWindowService, FeatureFlag, deploy/rollback scripts, CI pipeline"
git push origin batch7/07-deploy-infrastructure
git checkout main && git merge batch7/07-deploy-infrastructure && git push origin main
```

---

## Final Verification

After all 7 tasks are merged to main:

```bash
git checkout main && git pull origin main

# Full Rails test suite
cd apps/core && bundle exec rspec
cd apps/core && bundle exec rubocop

# Full Next.js checks (verify no regressions)
cd apps/web && npm run typecheck
cd apps/web && npm run lint

# Full AI gateway tests
cd apps/ai-gateway && pytest

# Verify Brakeman clean
cd apps/core && bundle exec brakeman --no-pager -q
```

If everything passes, Batch 7 backend is complete. Frontend tasks are deferred to a future batch.

---

## Completion Tracker

| # | Task | Branch | Depends On | Status |
|---|------|--------|------------|--------|
| 01 | Security Audit | `batch7/01-security-audit` | — | [ ] |
| 02 | Database Scaling | `batch7/02-database-scaling` | — | [ ] |
| 03 | Backup & Restore | `batch7/03-backup-restore` | 02 | [ ] |
| 04 | Monitoring & Alerting | `batch7/04-monitoring-alerting` | 02 | [ ] |
| 05 | Tenant Provisioning | `batch7/05-tenant-provisioning` | 01, 03 | [ ] |
| 06 | AI Safety Depth | `batch7/06-ai-safety` | — | [ ] |
| 07 | Deploy Infrastructure | `batch7/07-deploy-infrastructure` | 04 | [ ] |
