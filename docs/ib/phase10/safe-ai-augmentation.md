# Safe AI Augmentation

## Scope
Phase 10 Tasks 455-464 keep AI assistive, review-first, and tightly scoped to existing IB workflows. The implementation adds bounded support for report summaries, family language, reflection summarization, evidence-gap analysis, inquiry-language suggestions, translation review, and proofing.

## Backend contract
- `Ib::Ai::TaskCatalog` defines the supported IB task types, default roles, review requirements, output modes, and human-only boundaries.
- `Ib::Ai::GuardrailService` sanitizes context, redacts common PII, limits grounding/source payload size, and rejects human-only actions such as `publish`, `release`, `deliver`, and `approve`.
- `Ib::Ai::TemplateService` turns each supported workflow into a grounded prompt contract with explicit output shape.
- `Ib::Ai::Orchestrator` is the single path for IB AI task preparation and writes tenant controls, review requirements, and audit metadata into the invocation context.
- `AiInvocationsController` and `AiStreamController` preserve legacy `requires_approval` blocking for generic AI tasks while allowing IB tasks to remain review-gated instead of hard-blocked.

## Frontend review surface
- `IbAiAssistPanel` provides one reviewable AI surface for document language, report summaries, family publishing, and mobile reflection review.
- Diff-mode tasks require explicit teacher review in `AiApplyModal`; nothing is auto-applied.
- Analysis-mode tasks surface bounded markdown guidance plus teacher trust feedback (`Helpful` / `Needs work`).
- Home payloads now expose AI readiness, tenant controls, trust averages, and task availability through the teacher console.

## Auditability and privacy
- Generated IB AI invocations log `ib_ai_invocation_generated`.
- Review/apply actions log `ib_ai_invocation_reviewed`.
- Invocation payloads persist grounding refs, workflow labels, tenant controls, quality-track metadata, and review/apply metadata.
- Tenant controls currently support `enabled`, `allow_guardian_translation`, `pii_redaction`, `max_grounding_refs`, `max_excerpt_chars`, and `max_source_chars`.

## Manual QA
1. Run an IB report summary assist and confirm the response includes grounding refs and human-only boundaries.
2. Review a diff in `AiApplyModal` and verify only selected fields are patched back into the source workflow.
3. Trigger a guardrail violation by attempting a human-only action and confirm the API returns `422` with a bounded error.
4. Review the invocation record in the admin AI surface and confirm review/apply metadata is visible.
