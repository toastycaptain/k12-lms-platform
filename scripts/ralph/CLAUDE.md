# Ralph Iteration Instructions — K-12 Planning + LMS Platform

You are one iteration of Ralph, an autonomous AI agent loop.
Each iteration is a FRESH instance. You have NO memory of previous iterations.

## Your Memory Sources
1. `scripts/ralph/prd.json` — the task list (which stories pass/fail)
2. `scripts/ralph/progress.txt` — learnings from previous iterations
3. Git history — committed code from previous iterations
4. `CLAUDE.md` files in directories — patterns and conventions

## Architecture Context (DO NOT DEVIATE)
- Monorepo: /apps/web (Next.js), /apps/core (Rails API-only), /apps/ai-gateway (FastAPI)
- Shared packages: /packages/ui (design system), /packages/contracts (OpenAPI + JSON Schemas)
- Rails is the system of record, API-only mode, JSON REST under /api/v1
- Every DB table MUST include tenant_id (multi-tenancy)
- Auth: OIDC via OmniAuth (Google), SAML via omniauth-saml
- Background jobs: Sidekiq (all jobs idempotent)
- Storage: Active Storage + S3-compatible with signed URLs
- Search: Postgres FTS (Phase 1-2)

## Execution Steps

1. Read `scripts/ralph/prd.json`
2. Read `scripts/ralph/progress.txt` (check Codebase Patterns section first)
3. Check you're on the correct branch from PRD `branchName`. If not, check it out or create from main.
4. Pick the highest priority user story where `passes: false`
5. Read relevant CLAUDE.md files in affected directories
6. Implement ONLY that single story
7. Run quality checks (see below)
8. If checks pass: commit with message "feat(US-XXX): [story title]"
9. Update `scripts/ralph/prd.json` — set story `passes: true`
10. Append learnings to `scripts/ralph/progress.txt`
11. Update relevant CLAUDE.md files with discovered patterns

## Quality Checks (MUST ALL PASS before committing)

### Rails Core (/apps/core)
```bash
cd apps/core
bundle exec rails db:migrate
bundle exec rubocop --autocorrect
bundle exec rspec
bundle exec rails db:seed:replant 2>/dev/null || true
```

### Next.js Frontend (/apps/web)
```bash
cd apps/web
npm run lint
npm run typecheck
npm run build
npm test 2>/dev/null || true
```

### General
```bash
git diff --check  # no whitespace errors
```

If any check fails, fix the issue before committing. Do NOT skip checks.

## Commit Rules
- One commit per story
- Commit message: `feat(US-XXX): short description`
- Include ALL changed files (prd.json, progress.txt, CLAUDE.md updates)
- Push to the feature branch after each commit

## CLAUDE.md Updates
After each story, check if you learned something future iterations should know:
- API patterns specific to this codebase
- Gotchas (e.g., "tenant_id must be set in before_action, not manually")
- File locations worth noting
- Test patterns that work

## Critical Constraints (from PRD)
- Do NOT invent features not in the PRD
- Do NOT add real-time collaborative editing, video conferencing, full SIS, proctoring, or marketplace
- Every model MUST be tenant-scoped
- RBAC must be enforced at controller AND policy level
- AI features are Phase 6 — do not implement them in earlier phases

## Stop Condition
If ALL stories have `passes: true`, output exactly:
<promise>COMPLETE</promise>
