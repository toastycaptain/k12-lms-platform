# CLAUDE.md — K-12 LMS Platform

## Quick Reference
- Rails app: apps/core
- Next.js app: apps/web
- AI Gateway: apps/ai-gateway
- Specs: spec/PRD_K12_Planning_LMS_AI_Optimized.md, spec/TECH_SPEC_K12_Planning_LMS.md, spec/UX_SPEC_K12_Planning_LMS.md

## Patterns
- Tenant scoping: use `Current.tenant` from `ActiveSupport::CurrentAttributes`
- All models inherit from `ApplicationRecord` which includes `TenantScoped` concern
- API serialization: ActiveModelSerializers
- Auth: OmniAuth callback → session/token → `Current.user` set in `ApplicationController`
- Authorization: Pundit policy per model, `authorize` called in every action
