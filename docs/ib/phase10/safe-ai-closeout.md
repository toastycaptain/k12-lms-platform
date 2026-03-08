# Safe AI Closeout

## Quality and trust signals
- `Ib::Ai::QualityService` defines benchmark scenarios for grounded reflection support, report clarity, and glossary-aware translation review.
- The same service defines red-team scenarios for publish escalation, PII leakage, and unsupported claims.
- `Ib::Ai::AdoptionService` aggregates 30-day invocation, review, apply, trust, and estimated-minutes-saved metrics.
- `Ib::Ai::PolicyMatrixService` packages task availability, provider readiness, review requirements, quality tracks, tenant controls, benchmarks, and red-team scenarios into the teacher-home payload.

## Boundaries kept in place
- AI remains assistive only. Publication, approval, release, and delivery stay human-only.
- Provider/task availability is still role-scoped through `AiTaskPolicy` plus IB default-role fallback.
- Diff review is still required before any content-changing IB assist is applied.
- Guardian translation support remains tenant-controlled and review-first.

## Remaining risks
- Output quality still depends on prompt discipline and provider behavior; pilot feedback is required before broad rollout.
- PII redaction is regex-based and should be supplemented with stronger detection if schools start sending noisier source exports.
- Translation and proofing tasks are advisory only; operators still need manual spot checks during pilot validation.

## Ready for pilot validation
- Report summary drafting with visible grounding
- Family-language polishing with teacher diff review
- Reflection summarization inside the mobile approval flow
- Teacher-home AI readiness and trust reporting
