# CLAUDE.md — K-12 LMS Platform

## Quick Reference
- Rails app: apps/core
- Next.js app: apps/web
- Specs: docs/PRD_K12_Planning_LMS_AI_Optimized.md, docs/TECH_SPEC_K12_Planning_LMS.md, docs/UX_SPEC_K12_Planning_LMS.md

## Patterns
- Tenant scoping: use `Current.tenant` from `ActiveSupport::CurrentAttributes`
- All models inherit from `ApplicationRecord` which includes `TenantScoped` concern
- API serialization: ActiveModelSerializers
- Auth: OmniAuth callback → session/token → `Current.user` set in `ApplicationController`
- Authorization: Pundit policy per model, `authorize` called in every action
