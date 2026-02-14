# K-12 Planning + LMS Platform

Monorepo for a planner-first K-12 platform spanning curriculum planning, instruction delivery, assessment, integrations, and AI assistance.

## Services

| Path | Stack | Responsibility |
| --- | --- | --- |
| `apps/web` | Next.js + TypeScript | Teacher/admin/student UI |
| `apps/core` | Rails API-only | System of record, auth, policies, background jobs |
| `apps/ai-gateway` | FastAPI | LLM provider routing, safety checks, prompt orchestration |

## Shared Artifacts

| Path | Purpose |
| --- | --- |
| `spec/` | Authoritative PRD/Tech/UX documents |
| `docs/TRACEABILITY.md` | Spec-to-implementation tracking |
| `docs/BLOCKERS.md` | Open decisions and blockers |
| `packages/contracts` | API contracts and schemas |
| `packages/ui` | Shared UI components |

## Local Prerequisites

- Node.js 20+
- Ruby 4.0+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+

## Quick Start

```bash
git clone https://github.com/toastycaptain/k12-lms-platform.git
cd k12-lms-platform

# Web
cd apps/web
npm ci
npm run dev

# Core API (new terminal)
cd apps/core
bundle install
bundle exec rails db:prepare
bundle exec rails server -p 3001

# AI Gateway (new terminal)
cd apps/ai-gateway
python3 -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
uvicorn app.main:app --reload --port 8000
```

## Quality Commands

```bash
# Full web checks
cd apps/web && npm run ci

# Core static checks
cd apps/core && bundle exec rubocop && bundle exec brakeman --quiet --no-pager --exit-on-warn --exit-on-error

# AI gateway tests
cd apps/ai-gateway && pytest

# Optional root shortcuts
make web-ci
make ai-ci
```

## Non-Negotiables

- Multi-tenancy must be preserved in all persisted domain entities.
- Authorization uses Pundit and must be enforced at every API action.
- All API endpoints live under `/api/v1` (JSON only).
- Features outside the PRD are out of scope.

## Contribution Workflow

1. Branch from `main`.
2. Reference requirement IDs in commits/PR (`PRD-*`, `TECH-*`, `UX-*`).
3. Keep `docs/TRACEABILITY.md` current.
4. Ensure CI and local checks pass before requesting review.

## License

Proprietary - all rights reserved.
