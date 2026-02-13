# K–12 Planning + LMS Platform

A K–12 web application that combines curriculum planning, course delivery, assessment, Google Workspace integration, and admin-controlled AI assistance into a single, planner-first experience.

## Architecture

| Service | Stack | Purpose |
|---------|-------|---------|
| `apps/web` | Next.js (React) | Frontend SPA |
| `apps/core` | Ruby on Rails (API-only) | System of record, REST API |
| `apps/ai-gateway` | FastAPI | Model adapters, prompts, safety layer |

## Repository Layout

```
k12-lms-platform/
├── spec/                  # PRD, Tech Spec, UX Spec (authoritative)
├── apps/
│   ├── web/               # Next.js frontend
│   ├── core/              # Rails API
│   └── ai-gateway/        # FastAPI service
├── packages/
│   ├── ui/                # Shared design system
│   └── contracts/         # OpenAPI + JSON Schemas
├── docs/
│   ├── TRACEABILITY.md    # Spec → implementation mapping
│   └── BLOCKERS.md        # Known blockers & decisions needed
├── .github/
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/         # CI/CD pipelines
└── README.md
```

## Getting Started

> **Prerequisites:** Node.js 20+, Ruby 3.3+, Python 3.11+, PostgreSQL 15+, Redis

```bash
# Clone the repo
git clone https://github.com/<org>/k12-lms-platform.git
cd k12-lms-platform

# Start each service (see individual READMEs in apps/)
```

## Specification Documents

All authoritative product and technical specifications live in `spec/`. Read `spec/00_README_FOR_AI.md` for document hierarchy and execution rules.

## Contributing

1. Create a feature branch from `main`
2. Follow the PR template in `.github/PULL_REQUEST_TEMPLATE.md`
3. Ensure CI passes before requesting review
4. Reference spec requirement IDs (e.g. `PRD-7`, `TECH-2.4`) in commits and PRs

## License

Proprietary — All rights reserved.
