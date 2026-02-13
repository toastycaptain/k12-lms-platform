# Technical Specification — Rails Core + AI Gateway + Next.js
**AI-Optimized Technical Specification**

---

## 2.1 System Architecture

### Services
1. web — Next.js (React)
2. core — Ruby on Rails (API-only, system of record)
3. ai-gateway — FastAPI (model adapters, prompts, safety)
4. worker — Sidekiq (Rails background jobs)
5. search — Postgres FTS (Phase 1–2), OpenSearch/Elasticsearch (Phase 3+)
6. object storage — S3-compatible storage with signed URLs (Active Storage)

### Data Flow
- Next.js → Rails Core (JSON REST; optional GraphQL later)
- Rails Core → AI Gateway (HTTP; async where needed)
- Rails workers → Google / SIS / LTI APIs
- Rails emits audit events to DB and logs

---

## 2.2 Repository Structure (Monorepo)

/apps/web — Next.js frontend  
/apps/core — Rails API  
/apps/ai-gateway — FastAPI service  
/packages/ui — Shared design system  
/packages/contracts — OpenAPI + JSON Schemas  

---

## 2.3 Tenancy and Authentication

### Tenancy
- Every table includes tenant_id
- Tenant scoping enforced in controllers, models, and policies
- Optional: Postgres Row-Level Security (later phase)

### Authentication
- OIDC via OmniAuth (Google)
- SAML via omniauth-saml
- Token strategy:
  - Short-lived access + refresh tokens (preferred)
  - Session cookies + CSRF (alternative)

---

## 2.4 Core Data Model

### Identity / Organization
- tenants, schools, academic_years, terms
- users, roles, permissions, user_roles
- courses, sections, enrollments
- guardian_links

### Planning
- standard_frameworks, standards
- unit_plans, unit_versions
- lesson_plans, lesson_versions
- templates, template_versions
- approvals

### LMS
- modules, module_items
- assignments, submissions
- rubrics, rubric_criteria, rubric_scores
- discussions, discussion_posts
- announcements, messages, threads

### Assessment
- question_banks
- questions, question_versions
- quizzes, quiz_items
- quiz_attempts, attempt_answers

### Resources / Files
- resource_links
- ActiveStorage tables

### Integrations
- integration_configs
- sync_runs, sync_logs, sync_mappings

### AI
- ai_provider_configs
- ai_task_policies
- ai_templates
- ai_invocations

---

## 2.5 API Style
- REST JSON under /api/v1
- OpenAPI schemas in /packages/contracts

---

## 2.6 Key Endpoints
(See original PRD for full list; endpoints mirror defined domains)

---

## 2.7 Background Jobs
- Integration syncs
- PDF exports
- QTI imports
- AI async tasks

All jobs are idempotent.

---

## 2.8 Search Strategy
- Postgres FTS initially
- OpenSearch later

---

## 2.9 Storage
- Active Storage + S3-compatible
- Signed URLs

---

## 2.10 AI Gateway Contract
- /v1/generate
- /v1/generate_stream
- /v1/providers
- /v1/health

---

## 2.11 Security & Observability
- TLS, encryption
- Audit logs
- Metrics and runbooks
