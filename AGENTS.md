# K-12 Planning + LMS Platform — Agent Instructions

## Project Overview
K-12 web application combining curriculum planning, course delivery, assessment, and Google integration.
See `spec/` for full PRD, Tech Spec, and UX Spec.

## Architecture
- Monorepo with three apps and two shared packages
- apps/core: Rails 8+ API-only (system of record)
- apps/web: Next.js 16+ with TypeScript and Tailwind
- apps/ai-gateway: FastAPI gateway service
- packages/ui: Shared design system components
- packages/contracts: OpenAPI specs and JSON schemas

## Critical Rules
1. Every database table MUST have tenant_id (NOT NULL, indexed)
2. All queries MUST be scoped to Current.tenant
3. RBAC via Pundit on every controller action
4. API routes under /api/v1, JSON only
5. Do NOT implement features not in the PRD
6. Do NOT add: real-time collab editing, video conferencing, full SIS, proctoring, marketplace

## Tech Stack
- Ruby on Rails 8+ (API-only)
- PostgreSQL
- Next.js 16+ (App Router, TypeScript, Tailwind)
- Sidekiq for background jobs
- Pundit for authorization
- OmniAuth for authentication (Google OIDC)
- Active Storage + S3 for file storage
- RSpec for Rails tests

## Commands
```bash
# Rails
cd apps/core && bundle exec rspec
cd apps/core && bundle exec rubocop
cd apps/core && bundle exec rails db:migrate

# Next.js
cd apps/web && npm run lint
cd apps/web && npm run typecheck
cd apps/web && npm run build

# AI gateway
cd apps/ai-gateway && pip install -e .[dev]
cd apps/ai-gateway && pytest
```
