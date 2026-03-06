# K–12 LMS Administrator Perspective Assessment Playbook (Read‑Only)

These Markdown files are designed to be run **sequentially** by Codex AI to assess a K–12 Learning Management System (LMS) codebase from an **administrator perspective** (district IT/SIS admins, curriculum leaders, building admins).

## Non‑negotiable rules (Read‑Only Mode)

**You must make NO code changes.**
- Do **not** modify, add, delete, rename, or reformat any files.
- Do **not** run commands that change files (formatters, auto-fixers, migrations, codegen, package lock updates, etc.).
- Do **not** open PRs or apply patches.
- If a tool tries to auto‑save, **disable** it or avoid that workflow.

**Allowed actions**
- Read files.
- Search/grep/ripgrep.
- Run read-only commands (e.g., `git status`, `git diff` to confirm no changes; `npm test` only if it does not write snapshots; `pytest` only if it doesn’t generate files; `cat`, `jq`, `tree`).
- Start local services only if you are confident it won’t write to the repo and won’t touch production resources.

**Disallowed / high-risk actions**
- Running database migrations against any environment.
- Connecting to production databases or services.
- Running scripts that may write caches, build artifacts, snapshots, or lockfiles in the repo.
- Installing/updating dependencies if it writes lockfiles.

If you need to propose changes, do it as **recommendations only** in your final report.

---

## What “effective” means in this assessment

An LMS is “significantly effective” for administrators when it:

1. **Scales reliably** (district → schools → courses/sections/terms) with delegated administration.
2. **Minimizes operational work** (rosters, roles, sync, troubleshooting).
3. **Centralizes content governance** (templates/blueprints, controlled sharing, versioning).
4. **Integrates cleanly** (SIS/OneRoster, SSO/IdP, LTI tools, analytics).
5. **Provides accountability** (audit logs, reports, exports).
6. **Meets security/privacy expectations** (least privilege, MFA/SSO, data minimization).

This playbook translates those needs into **codebase-verifiable** requirements.

---

## Deliverables (produced in chat only)

You will output:

1. **Service & domain map** (from `01_REPO_DISCOVERY.md`)
2. **Category findings** (from each subsequent file)
3. **Evidence ledger** (file paths + line ranges + short snippets)
4. **Final scorecard** (from `15_SCORECARD_AND_FINAL_REPORT.md`)

**Do not write any report files into the repository.** Provide the report content directly in your final response.

---

## Evidence standards (how to “prove” a requirement)

For every requirement you assess, you must include at least one of:
- File path(s) + line ranges where implemented
- API routes / controllers / handlers
- DB models / migrations / schema definitions
- Frontend components & routes
- Config, feature flags, or deployment manifests
- Tests that cover the behavior
- Audit/log event definitions

When uncertain, label it as **Unknown** and describe what evidence is missing.

---

## Scoring rubric (use consistently)

Each requirement is scored:

- **3 — Strong**: Implemented and enforced; tests/logging; admin UX considered; scalable.
- **2 — Partial**: Present but gaps exist (missing tests, incomplete scoping, edge cases).
- **1 — Minimal**: Bare-bones or implicit implementation; fragile; likely admin pain.
- **0 — Missing**: Not found in codebase.

Also assign **Risk**:
- **High**: could cause security/privacy failures, roster corruption, major outages, or compliance risk.
- **Medium**: causes significant admin overhead or adoption failure.
- **Low**: quality-of-life improvements.

---

## How to run these files sequentially

Proceed in order:

1. `01_REPO_DISCOVERY.md` → produce the service/domain map and a “where to look” index.
2. Then follow each numbered file. Each file assumes you have the map from step 1.
3. Finish with `15_SCORECARD_AND_FINAL_REPORT.md`.

If the repo is extremely large:
- Prioritize the **core LMS** services plus the **integration surfaces** (SIS, SSO, LTI, analytics, logging).
- Explicitly list what you did *not* inspect.

---

## Shared vocabulary (use in reporting)

Use these domain nouns as anchors when searching:
- **Org hierarchy**: district, school, org unit, sub-account, tenant
- **Academic structure**: term, academic year, grading period, course, section/class
- **People**: student, teacher, admin, guardian/observer, support
- **Enrollment**: membership, roster, role within class
- **Content**: template/blueprint, repository/library/commons, modules, assignments, files
- **Standards**: outcomes, competencies, CASE, GUID
- **Integrations**: SIS, OneRoster, CSV import, LTI 1.3, NRPS, AGS, Deep Linking
- **Accountability**: audit log, access log, system log, dataset export, analytics dashboards

---

## Output formatting requirements (use this structure)

For each section, output:

- **What I searched** (keywords, directories)
- **What I found** (high-level)
- **Findings table** (Requirement → Score → Risk → Evidence)
- **Notable gaps / edge cases**
- **Questions to confirm later** (only if evidence is genuinely missing)

Keep snippets short. Prefer file path + lines over long pasted code.
