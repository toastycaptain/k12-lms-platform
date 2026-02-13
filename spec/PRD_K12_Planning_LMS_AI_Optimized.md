# PRD — K–12 Planning + LMS Platform  
**Canonical Product Requirements Document (AI-Optimized)**

---

## 0. AI READING INSTRUCTIONS (NON-NEGOTIABLE)

<!-- AI-INSTRUCTIONS -->
- This document defines **WHAT must be built and WHY**.
- Implementation details (frameworks, languages, schemas) belong in the Technical Spec.
- Do NOT introduce features not explicitly listed as in-scope.
- Respect all out-of-scope constraints.
- Prefer incremental delivery aligned to milestones.
<!-- END -->

---

## 1. PRODUCT SUMMARY

### PRD-1: Product Definition
The system SHALL be a **K–12 web application** that combines the strongest capabilities of:
- Curriculum and unit planning (ManageBac, Toddle)
- Course delivery and assignment workflows (Schoology)
- Assessment engine and question banks (Moodle)
- Deep Google Workspace and Google Classroom integration
- Admin-controlled AI assistance for planning and assessment
- A clean, modern, **planner-first UX** comparable to Toddle

### PRD-2: Core Value Proposition
The system MUST enable schools to:
- Plan curriculum coherently
- Deliver instruction efficiently
- Assess learning meaningfully
- Integrate seamlessly with Google
- Use AI safely under institutional control

---

## 2. TARGET USERS & PERSONAS

### PRD-3: Primary Users
- **Teacher**
- **Student**
- **School Administrator**
- **Curriculum Lead**

### PRD-4: Secondary Users (Optional in MVP)
- **Parent/Guardian**
- **District/System Administrator**

---

## 3. PROBLEMS TO SOLVE (JOBS TO BE DONE)

### PRD-5: Teacher Problems
- Plan units and lessons aligned to standards without duplication
- Attach Drive resources and publish with minimal friction
- Differentiate and generate assessments with AI safely

### PRD-6: Curriculum & Admin Problems
- Maintain coherent curriculum across grades
- Standardize templates and approvals
- Reduce tool sprawl

---

## 4. GOALS & SUCCESS METRICS

### PRD-7: Product Goals
- Planner-first adoption
- Clean publish pipeline
- Google-native experience
- Safe AI augmentation

### PRD-8: MVP Success Metrics
- Time-to-first-unit < 20 minutes
- Weekly Active Teachers ≥ 60%
- ≥ 40% unit publish rate
- Drive attach < 30 seconds
- ≥ 25% AI weekly usage

---

## 5. SCOPE (PHASED DELIVERY)

### PRD-9: Phase 1 — Foundation
- Multi-tenancy
- RBAC
- Unit/Lesson versioning
- Drive attachments
- PDF export

### PRD-10: Phase 2 — Planning Excellence
- Templates
- Standards alignment
- Coverage reporting
- Optional approvals

### PRD-11: Phase 3 — LMS Core
- Courses and modules
- Assignments and submissions
- Rubrics and discussions

### PRD-12: Phase 4 — Assessment
- Question banks
- Quizzes and attempts
- Accommodations
- QTI import/export

### PRD-13: Phase 5 — Google Integrations
- Workspace Add-ons
- Classroom sync and add-ons

### PRD-14: Phase 6 — AI Gateway
- Admin model registry
- Task policies
- AI-assisted planning
- Auditing

### PRD-15: Phase 7 — Institutional Hardening
- OneRoster
- LTI (optional)
- Governance and DR

---

## 6. OUT OF SCOPE

### PRD-16: Explicit Non-Goals
- Real-time collaborative editing
- Video conferencing
- Full SIS
- Proctoring
- Resource marketplace

---

## 7. KEY WORKFLOWS

### PRD-17: Teacher Planning
Create unit → align standards → draft lessons → attach Drive → publish → schedule

### PRD-18: Course Delivery
View modules → submit → grade → feedback → mastery

### PRD-19: Assessment
Build quiz → assign → attempt → analyze

### PRD-20: Google-Native
Attach Drive → create Docs/Slides → assign via Classroom

### PRD-21: AI-Assisted Planning
Invoke AI → review output → save draft → enforce policy

---

## 8. REQUIREMENTS

### PRD-22: Functional
- Multi-tenancy
- RBAC
- Versioning
- Standards mapping
- Publish pipeline
- Grading
- Assessments
- Google integration
- AI integration
- Audit logging

### PRD-23: Non-Functional
- Security
- Privacy
- Reliability
- Performance
- Accessibility
- Observability

---

## 9. RISKS & MITIGATIONS

### PRD-24
- Integration complexity → early integration epic
- Workflow mismatch → templates and onboarding
- AI safety → isolated gateway
- Scope creep → phased rollout
- Multi-tenancy bugs → strict scoping

---

## 10. MILESTONES

### PRD-25
- M1: Auth + tenancy + planner core
- M2: Templates + standards
- M3: LMS core
- M4: Assessment engine
- M5: Google add-ons
- M6: AI gateway
- M7: Institutional hardening
