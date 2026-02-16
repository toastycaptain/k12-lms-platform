# Codex Instructions — Railway CI/CD Alignment

## Objective

Replace the existing Kamal-based deployment workflow with a Railway-compatible CI/CD pipeline. The platform is deployed on Railway with three services (k12-core, k12-sidekiq, k12-web), backed by a Supabase PostgreSQL database and Railway-hosted Redis. The CI workflow (`ci.yml`) is already functional and should not be modified. This task rewrites `deploy.yml`, adds a staging environment, creates smoke tests, enhances the Dependabot configuration, and adds release tagging.

---

## What Already Exists

### Deployment Infrastructure
- **Railway services:** k12-core (Rails API), k12-sidekiq (background jobs), k12-web (Next.js frontend)
- **Database:** Supabase PostgreSQL (external to Railway)
- **Redis:** Hosted on Railway, used by Sidekiq
- **Dockerfiles:**
  - `apps/core/Dockerfile` — Rails API (Puma, port 3000)
  - `apps/core/Dockerfile.sidekiq` — Sidekiq worker
  - `apps/web/Dockerfile` — Next.js (port 3000)
  - `apps/ai-gateway/Dockerfile` — Python FastAPI (port 8000)

### CI/CD Files
- `.github/workflows/ci.yml` — Working CI pipeline (lint, typecheck, build, test for web, core, ai-gateway). **Do NOT modify.**
- `.github/workflows/deploy.yml` — Current deployment workflow using Kamal. **Must be replaced entirely.**
- `.github/dependabot.yml` — Existing Dependabot config (needs enhancement with grouping)
- `scripts/backup.sh` — Existing database backup script

### Key Endpoints
- `/up` — Rails liveness check (returns 200 when server is running)
- `/api/v1/health` — Rails readiness check (returns 200 with `{"status": "ok"}`)
- `/` — Next.js frontend homepage
- `/auth/google_oauth2` — OAuth initiation (should redirect with 302)

---

## Task 1: Rewrite deploy.yml for Railway

**Replace:** `.github/workflows/deploy.yml`

Remove all Kamal references. Write a new workflow that deploys to Railway using the Railway CLI.

### Workflow Structure

```yaml
name: Deploy

on:
  workflow_run:
    workflows: ["Monorepo CI"]
    types: [completed]

concurrency:
  group: deploy-${{ github.event.workflow_run.head_branch }}
  cancel-in-progress: false
```

### Production Deploy Job

**Job name:** `deploy_production`

**Condition:** Only run when CI succeeds AND the branch is `main`:
```yaml
if: >-
  ${{
    github.event.workflow_run.conclusion == 'success' &&
    github.event.workflow_run.head_branch == 'main'
  }}
```

**Environment:** `production`

**Steps (in order):**

1. **Checkout** the code at the workflow_run head SHA:
   ```yaml
   - uses: actions/checkout@v4
     with:
       ref: ${{ github.event.workflow_run.head_sha }}
       fetch-depth: 0  # Needed for release tagging (Task 6)
   ```

2. **Install Railway CLI** using npx (do not install globally):
   ```yaml
   - name: Install Railway CLI
     run: npm install -g @railway/cli
   ```

3. **Run database migrations** (see Task 2 for details):
   ```yaml
   - name: Run database migrations
     run: railway run -s k12-core -- bundle exec rails db:migrate
     env:
       RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
       RAILWAY_PROJECT_ID: ${{ secrets.RAILWAY_PROJECT_ID }}
   ```

4. **Deploy k12-core** (first, because it runs the API and must be ready for others):
   ```yaml
   - name: Deploy k12-core
     run: railway up -s k12-core --detach
     env:
       RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
       RAILWAY_PROJECT_ID: ${{ secrets.RAILWAY_PROJECT_ID }}
   ```

5. **Deploy k12-sidekiq** (second, depends on core being up):
   ```yaml
   - name: Deploy k12-sidekiq
     run: railway up -s k12-sidekiq --detach
     env:
       RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
       RAILWAY_PROJECT_ID: ${{ secrets.RAILWAY_PROJECT_ID }}
   ```

6. **Deploy k12-web** (last, the frontend):
   ```yaml
   - name: Deploy k12-web
     run: railway up -s k12-web --detach
     env:
       RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
       RAILWAY_PROJECT_ID: ${{ secrets.RAILWAY_PROJECT_ID }}
   ```

7. **Wait for deployment to stabilize** (Railway deployments are async when using `--detach`):
   ```yaml
   - name: Wait for deployments to stabilize
     run: sleep 60
   ```

8. **Post-deploy health checks** (see Task 4 for the full smoke test script):
   ```yaml
   - name: Smoke tests
     run: bash scripts/smoke-test.sh "${{ secrets.PRODUCTION_CORE_URL }}" "${{ secrets.PRODUCTION_WEB_URL }}"
   ```

9. **Rollback on failure** — if the smoke test step fails, roll back all services:
   ```yaml
   - name: Rollback on failure
     if: failure()
     run: |
       echo "Health checks failed. Initiating rollback..."
       railway down -s k12-core -y || true
       railway down -s k12-sidekiq -y || true
       railway down -s k12-web -y || true
       echo "Rollback triggered. Manual verification required."
       echo "::error::Deployment failed health checks. Services have been rolled back."
     env:
       RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
       RAILWAY_PROJECT_ID: ${{ secrets.RAILWAY_PROJECT_ID }}
   ```

10. **Release tagging** (see Task 6):
    ```yaml
    - name: Tag release
      if: success()
      run: |
        TAG="v$(date -u +%Y%m%d)-$(git rev-parse --short HEAD)"
        git tag "$TAG"
        git push origin "$TAG"
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    ```

### Required GitHub Secrets

Document these as comments at the top of deploy.yml:

| Secret | Description |
|--------|-------------|
| `RAILWAY_TOKEN` | Railway API token for CLI authentication |
| `RAILWAY_PROJECT_ID` | Railway project ID (production) |
| `RAILWAY_STAGING_PROJECT_ID` | Railway project ID (staging) — see Task 3 |
| `RAILWAY_STAGING_ENVIRONMENT_ID` | Railway environment ID for staging |
| `PRODUCTION_CORE_URL` | Production URL for k12-core (e.g., `https://core.example.com`) |
| `PRODUCTION_WEB_URL` | Production URL for k12-web (e.g., `https://app.example.com`) |
| `STAGING_CORE_URL` | Staging URL for k12-core |
| `STAGING_WEB_URL` | Staging URL for k12-web |

**Do NOT hardcode** any Railway project IDs, service IDs, or URLs in the workflow file. All must come from GitHub Actions secrets.

---

## Task 2: Database Migration Step

### Migration Execution

The migration step runs BEFORE any service deployment. It uses `railway run` to execute the migration command inside the Railway environment (which has access to the production DATABASE_URL).

```yaml
- name: Run database migrations
  id: migrate
  run: |
    echo "--- Starting database migration ---"
    # NOTE: Before running migrations that drop columns or tables,
    # manually run scripts/backup.sh or take a Supabase snapshot.
    railway run -s k12-core -- bundle exec rails db:migrate 2>&1 | tee migration_output.log
    echo "--- Migration complete ---"
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
    RAILWAY_PROJECT_ID: ${{ secrets.RAILWAY_PROJECT_ID }}
```

### Migration Failure Handling

If the migration command exits with a non-zero code, the step fails and all subsequent deployment steps are skipped (standard GitHub Actions behavior with sequential steps). No explicit abort logic is needed because later steps depend on earlier steps succeeding.

Add this step immediately after migration to upload the log as an artifact:

```yaml
- name: Upload migration log
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: migration-log-${{ github.run_number }}
    path: migration_output.log
    retention-days: 30
```

### Pre-Migration Backup Reminder

Add a comment block in the workflow above the migration step:

```yaml
# ===========================================================
# IMPORTANT: Before deploying destructive migrations (dropping
# columns, tables, or altering data), manually create a backup:
#   1. Run scripts/backup.sh on the production database, OR
#   2. Create a Supabase snapshot from the dashboard
# The migration step does NOT create automatic backups.
# ===========================================================
```

---

## Task 3: Staging Environment

### Staging Deploy Job

Add a second job in `deploy.yml` named `deploy_staging`. This job runs when CI succeeds on the `staging` branch.

```yaml
deploy_staging:
  if: >-
    ${{
      github.event.workflow_run.conclusion == 'success' &&
      github.event.workflow_run.head_branch == 'staging'
    }}
  name: Deploy staging
  runs-on: ubuntu-latest
  environment: staging
  steps:
    - uses: actions/checkout@v4
      with:
        ref: ${{ github.event.workflow_run.head_sha }}

    - name: Install Railway CLI
      run: npm install -g @railway/cli

    - name: Run database migrations (staging)
      run: |
        echo "--- Starting staging database migration ---"
        railway run -s k12-core -- bundle exec rails db:migrate 2>&1 | tee migration_output.log
        echo "--- Staging migration complete ---"
      env:
        RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        RAILWAY_PROJECT_ID: ${{ secrets.RAILWAY_STAGING_PROJECT_ID }}
        RAILWAY_ENVIRONMENT_ID: ${{ secrets.RAILWAY_STAGING_ENVIRONMENT_ID }}

    - name: Upload migration log
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: staging-migration-log-${{ github.run_number }}
        path: migration_output.log
        retention-days: 14

    - name: Deploy k12-core (staging)
      run: railway up -s k12-core --detach
      env:
        RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        RAILWAY_PROJECT_ID: ${{ secrets.RAILWAY_STAGING_PROJECT_ID }}
        RAILWAY_ENVIRONMENT_ID: ${{ secrets.RAILWAY_STAGING_ENVIRONMENT_ID }}

    - name: Deploy k12-sidekiq (staging)
      run: railway up -s k12-sidekiq --detach
      env:
        RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        RAILWAY_PROJECT_ID: ${{ secrets.RAILWAY_STAGING_PROJECT_ID }}
        RAILWAY_ENVIRONMENT_ID: ${{ secrets.RAILWAY_STAGING_ENVIRONMENT_ID }}

    - name: Deploy k12-web (staging)
      run: railway up -s k12-web --detach
      env:
        RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        RAILWAY_PROJECT_ID: ${{ secrets.RAILWAY_STAGING_PROJECT_ID }}
        RAILWAY_ENVIRONMENT_ID: ${{ secrets.RAILWAY_STAGING_ENVIRONMENT_ID }}

    - name: Wait for deployments to stabilize
      run: sleep 60

    - name: Smoke tests (staging)
      run: bash scripts/smoke-test.sh "${{ secrets.STAGING_CORE_URL }}" "${{ secrets.STAGING_WEB_URL }}"
```

### CI Workflow Trigger Update

The existing `ci.yml` triggers on `push` to `main` and `codex/**` branches. For the staging workflow_run trigger to work, update the `on.push.branches` list in `ci.yml` to also include `staging`. **However**, the instructions say do NOT modify `ci.yml`. Instead, document this as a prerequisite:

> **PREREQUISITE (manual step):** Add `staging` to the `on.push.branches` list in `.github/workflows/ci.yml` so that pushes to the `staging` branch trigger CI, which in turn triggers the staging deploy via `workflow_run`. Alternatively, add a separate `on.push` trigger directly in `deploy.yml` for the staging branch if the `workflow_run` approach is not suitable.

If the strict "do not modify ci.yml" rule must be followed, add an alternative `on.push` trigger in `deploy.yml` itself:

```yaml
on:
  workflow_run:
    workflows: ["Monorepo CI"]
    types: [completed]
  push:
    branches:
      - staging
```

And add a separate condition to the staging job to handle both trigger types. Document this trade-off in a comment.

---

## Task 4: Smoke Test Script

**Create:** `scripts/smoke-test.sh`

This script accepts two positional arguments: the core API base URL and the web frontend base URL.

```bash
#!/usr/bin/env bash
set -euo pipefail

CORE_URL="${1:?Usage: smoke-test.sh <CORE_URL> <WEB_URL>}"
WEB_URL="${2:?Usage: smoke-test.sh <CORE_URL> <WEB_URL>}"

PASS=0
FAIL=0

check() {
  local description="$1"
  local url="$2"
  local expected_status="$3"
  local body_check="${4:-}"

  echo -n "  [TEST] ${description} ... "

  response=$(curl -s -o /tmp/smoke_body -w "%{http_code}" --max-time 15 "${url}" 2>/dev/null) || {
    echo "FAIL (curl error)"
    FAIL=$((FAIL + 1))
    return
  }

  if [[ "$response" != "$expected_status" ]]; then
    echo "FAIL (expected ${expected_status}, got ${response})"
    FAIL=$((FAIL + 1))
    return
  fi

  if [[ -n "$body_check" ]]; then
    if ! grep -q "$body_check" /tmp/smoke_body; then
      echo "FAIL (body missing: ${body_check})"
      FAIL=$((FAIL + 1))
      return
    fi
  fi

  echo "PASS"
  PASS=$((PASS + 1))
}

echo "========================================"
echo " Smoke Tests"
echo "========================================"
echo ""
echo "Core API: ${CORE_URL}"
echo "Web App:  ${WEB_URL}"
echo ""

echo "--- Core API ---"
check "Liveness: GET /up returns 200" \
  "${CORE_URL}/up" "200"

check "Readiness: GET /api/v1/health returns 200 with status ok" \
  "${CORE_URL}/api/v1/health" "200" '"status"'

echo ""
echo "--- Web Frontend ---"
check "Homepage: GET / returns 200" \
  "${WEB_URL}/" "200"

echo ""
echo "--- Auth Flow ---"
check "OAuth redirect: GET /auth/google_oauth2 returns 302" \
  "${CORE_URL}/auth/google_oauth2" "302"

echo ""
echo "========================================"
echo " Results: ${PASS} passed, ${FAIL} failed"
echo "========================================"

if [[ "$FAIL" -gt 0 ]]; then
  echo ""
  echo "::error::Smoke tests failed: ${FAIL} check(s) did not pass."
  exit 1
fi
```

**Important:** The script must be executable:
```bash
chmod +x scripts/smoke-test.sh
```

### Curl Behavior Note

The OAuth check uses `curl -s` without `-L` (no follow redirects) so that a 302 is captured as the response code rather than following the redirect. If `curl` on the CI runner follows redirects by default, adjust accordingly. The `--max-time 15` flag prevents hanging on unresponsive services.

### Integration in deploy.yml

Reference the smoke test in both production and staging jobs:

```yaml
- name: Smoke tests
  run: bash scripts/smoke-test.sh "${{ secrets.PRODUCTION_CORE_URL }}" "${{ secrets.PRODUCTION_WEB_URL }}"
```

---

## Task 5: Enhance Dependabot Configuration

**Modify:** `.github/dependabot.yml`

The existing file already has entries for bundler, npm, pip, github-actions, and docker. Enhance it by adding grouping for minor/patch updates and ensuring consistent PR limits.

Replace the entire file with:

```yaml
version: 2

updates:
  # Ruby gems (apps/core)
  - package-ecosystem: bundler
    directory: "/apps/core"
    schedule:
      interval: weekly
      day: monday
    open-pull-requests-limit: 10
    groups:
      ruby-minor-patch:
        update-types:
          - minor
          - patch

  # npm packages (apps/web)
  - package-ecosystem: npm
    directory: "/apps/web"
    schedule:
      interval: weekly
      day: monday
    open-pull-requests-limit: 10
    groups:
      npm-minor-patch:
        update-types:
          - minor
          - patch

  # Python packages (apps/ai-gateway)
  - package-ecosystem: pip
    directory: "/apps/ai-gateway"
    schedule:
      interval: weekly
      day: monday
    open-pull-requests-limit: 10
    groups:
      python-minor-patch:
        update-types:
          - minor
          - patch

  # GitHub Actions
  - package-ecosystem: github-actions
    directory: "/"
    schedule:
      interval: weekly
      day: monday
    open-pull-requests-limit: 10
    groups:
      actions-minor-patch:
        update-types:
          - minor
          - patch

  # Docker base images (apps/core)
  - package-ecosystem: docker
    directory: "/apps/core"
    schedule:
      interval: weekly
      day: monday
    open-pull-requests-limit: 10
    groups:
      docker-minor-patch:
        update-types:
          - minor
          - patch
```

### Changes from existing config:
- Added `day: monday` to all schedules for predictable update timing
- Added `groups` with `update-types: [minor, patch]` to batch non-breaking updates into single PRs
- Unified `open-pull-requests-limit: 10` across all ecosystems (github-actions and docker were previously set to 5)

---

## Task 6: Release Tagging and Changelog

### Tag Format

After a successful production deployment, create a Git tag with the format:
```
v{YYYYMMDD}-{7-char-short-sha}
```

Example: `v20260215-a1b2c3d`

### Tag Creation Step

Add this as the final step of the `deploy_production` job (only runs on success):

```yaml
- name: Create release tag
  if: success()
  run: |
    SHORT_SHA=$(git rev-parse --short=7 HEAD)
    TAG="v$(date -u +%Y%m%d)-${SHORT_SHA}"
    echo "Creating tag: ${TAG}"
    git tag -a "$TAG" -m "Production deploy ${TAG}"
    git push origin "$TAG"
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Changelog Generation Step

Add a step after tagging to generate a changelog between the previous tag and HEAD:

```yaml
- name: Generate changelog
  if: success()
  run: |
    SHORT_SHA=$(git rev-parse --short=7 HEAD)
    TAG="v$(date -u +%Y%m%d)-${SHORT_SHA}"
    PREV_TAG=$(git describe --tags --abbrev=0 HEAD^ 2>/dev/null || echo "")
    echo "## Release ${TAG}" > changelog.txt
    echo "" >> changelog.txt
    if [[ -n "$PREV_TAG" ]]; then
      echo "Changes since ${PREV_TAG}:" >> changelog.txt
      echo "" >> changelog.txt
      git log "${PREV_TAG}..HEAD" --pretty=format:"- %s (%h)" --no-merges >> changelog.txt
    else
      echo "Initial release." >> changelog.txt
    fi
    echo "" >> changelog.txt
    echo "---" >> changelog.txt
    cat changelog.txt

- name: Upload changelog
  if: success()
  uses: actions/upload-artifact@v4
  with:
    name: changelog-${{ github.run_number }}
    path: changelog.txt
    retention-days: 90
```

### Note on `fetch-depth`

The checkout step in the production job MUST use `fetch-depth: 0` to ensure all tags and history are available for `git describe` and `git log` to work correctly. This is already specified in Task 1 step 1.

---

## Task 7: Verification

### 7a. YAML Linting

Validate the deploy workflow with `actionlint` or a YAML linter. If `actionlint` is not available, at minimum ensure:

```bash
# Install yamllint if needed
pip install yamllint

# Lint the deploy workflow
yamllint .github/workflows/deploy.yml

# Alternatively, use npx for actionlint
npx @action-validator/cli .github/workflows/deploy.yml
```

Manually verify:
- All `${{ }}` expressions are properly quoted and escaped
- All `env` blocks reference secrets (not hardcoded values)
- All `if` conditions are syntactically correct
- Job dependencies (`needs`) are correctly specified
- The `workflow_run` trigger references the exact workflow name `"Monorepo CI"`

### 7b. CI Workflow Unchanged

Confirm that `.github/workflows/ci.yml` has NOT been modified:

```bash
git diff .github/workflows/ci.yml
# Should show no changes
```

### 7c. Smoke Test Script

Verify the smoke test script:

```bash
# Check it is executable
test -x scripts/smoke-test.sh && echo "Executable: OK" || echo "Executable: FAIL"

# Check it validates arguments
bash scripts/smoke-test.sh 2>&1 | grep -q "Usage" && echo "Usage check: OK" || echo "Usage check: FAIL"

# Run against a local dev server (if available)
bash scripts/smoke-test.sh http://localhost:3000 http://localhost:3001
```

### 7d. Dependabot Config

Validate the Dependabot config:

```bash
# Basic YAML validation
yamllint .github/dependabot.yml

# Verify it has the required ecosystems
grep -c "package-ecosystem" .github/dependabot.yml
# Should output: 5 (bundler, npm, pip, github-actions, docker)

# Verify grouping is present
grep -c "groups:" .github/dependabot.yml
# Should output: 5
```

---

## Architecture Rules

1. **Do NOT modify application code.** Only CI/CD configuration files, deployment workflows, and scripts.
2. **Do NOT modify `.github/workflows/ci.yml`.** The CI workflow is already functional.
3. **Do NOT hardcode Railway project IDs, service IDs, or URLs.** All must come from GitHub Actions secrets.
4. **Use `RAILWAY_TOKEN` secret** for all Railway CLI authentication. Never store tokens in workflow files.
5. **Deploy order matters:** k12-core first (it runs migrations and the API), then k12-sidekiq, then k12-web.
6. **Railway CLI is available via `npm install -g @railway/cli`** on CI runners. Use `npx @railway/cli` as a fallback if global install fails.
7. **The `--detach` flag** on `railway up` allows the step to complete without waiting for the full Railway build. The explicit sleep + smoke test handles verification.
8. **Rollback is best-effort.** `railway down` reverts to the previous deployment but may not always succeed. The `|| true` ensures the rollback step itself does not mask the original failure.
9. **Secrets must be configured in GitHub repository settings** before the workflow will function. Document required secrets clearly.

---

## Files Changed

| File | Action |
|------|--------|
| `.github/workflows/deploy.yml` | **Replace** entire file (remove Kamal, add Railway) |
| `.github/dependabot.yml` | **Modify** to add grouping and consistent limits |
| `scripts/smoke-test.sh` | **Create** new file |

## Files NOT Changed

| File | Reason |
|------|--------|
| `.github/workflows/ci.yml` | Already working, must not be modified |
| `apps/core/Dockerfile` | Application code, not in scope |
| `apps/core/Dockerfile.sidekiq` | Application code, not in scope |
| `apps/web/Dockerfile` | Application code, not in scope |
| `apps/ai-gateway/Dockerfile` | Application code, not in scope |
| `scripts/backup.sh` | Existing script, not in scope |

---

## Testing

### Automated
```bash
# Lint all workflow files
yamllint .github/workflows/deploy.yml
yamllint .github/dependabot.yml

# Verify smoke test script is executable and has correct argument handling
bash scripts/smoke-test.sh 2>&1 | head -1
# Expected: contains "Usage"
```

### Manual Verification
1. Push to `staging` branch and verify the staging deploy job triggers
2. Push to `main` branch and verify CI triggers, then deploy triggers on CI success
3. Confirm all three services deploy in the correct order in the GitHub Actions log
4. Confirm smoke tests run after deployment and report pass/fail
5. Confirm a Git tag is created after successful production deploy
6. Confirm rollback triggers if smoke tests fail (can be tested by temporarily providing a wrong URL)

---

## Definition of Done

- [ ] `.github/workflows/deploy.yml` fully rewritten — no references to Kamal, `kamal`, `KAMAL_REGISTRY_PASSWORD`, or `bundle exec kamal` remain
- [ ] Deploy workflow uses `railway up` to deploy k12-core, k12-sidekiq, and k12-web in that order
- [ ] Deploy workflow uses `RAILWAY_TOKEN` and `RAILWAY_PROJECT_ID` from GitHub secrets (no hardcoded IDs)
- [ ] Database migration step runs `railway run -s k12-core -- bundle exec rails db:migrate` before deployment
- [ ] Migration output is logged and uploaded as an artifact
- [ ] Migration failure aborts the entire deployment (no services are deployed)
- [ ] Pre-migration backup reminder comment is present in the workflow
- [ ] Staging deploy job exists and triggers on the `staging` branch
- [ ] Staging job uses separate `RAILWAY_STAGING_PROJECT_ID` and `RAILWAY_STAGING_ENVIRONMENT_ID` secrets
- [ ] Staging job deploys all three services and runs smoke tests
- [ ] `scripts/smoke-test.sh` exists and is executable (`chmod +x`)
- [ ] Smoke test checks: `GET /up` (200), `GET /api/v1/health` (200 with status), `GET /` (200), `GET /auth/google_oauth2` (302)
- [ ] Smoke test accepts base URLs as arguments (not hardcoded)
- [ ] Smoke test exits non-zero on any failure
- [ ] Post-deploy health check step calls the smoke test script
- [ ] Rollback step runs `railway down` for all services if smoke tests fail
- [ ] `.github/dependabot.yml` updated with grouping for minor/patch updates
- [ ] Dependabot covers: bundler, npm, pip, github-actions, docker
- [ ] Dependabot groups minor and patch updates together per ecosystem
- [ ] Open PR limit is 10 for all ecosystems
- [ ] Release tag created after successful production deploy in format `v{YYYYMMDD}-{short-sha}`
- [ ] Changelog generated from git log between previous tag and HEAD
- [ ] Changelog uploaded as a build artifact
- [ ] `deploy.yml` passes YAML linting
- [ ] `dependabot.yml` passes YAML linting
- [ ] `.github/workflows/ci.yml` is completely unmodified
- [ ] No application code has been modified (only CI/CD and deployment files)
- [ ] No secrets or tokens are hardcoded in any file
