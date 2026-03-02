# Curriculum Adaptation Task Pack

This folder is the authoritative implementation pack for introducing curriculum-adaptive behavior in the K-12 LMS while preserving the current core architecture.

## Governance Constraint (Hard Requirement)
Curriculum configuration, formatting, profile selection, framework upload/import, and profile/package management are admin-exclusive operations.
Only users with the `admin` role may perform these actions.

Teachers, students, guardians, and curriculum leads are non-authoring consumers in this initiative:
- They must not be able to create, update, import, delete, or select curriculum profiles/frameworks.
- They only receive derived UI and course/planner data from the effective admin-configured profile.

## Pack Index
1. [00_MASTER_PLAN.md](./00_MASTER_PLAN.md)
2. [01_RESEARCH_BENCHMARKS.md](./01_RESEARCH_BENCHMARKS.md)
3. [02_ARCHITECTURE_DECISIONS.md](./02_ARCHITECTURE_DECISIONS.md)
4. [03_DATA_MODEL_AND_MIGRATIONS.md](./03_DATA_MODEL_AND_MIGRATIONS.md)
5. [04_API_CONTRACT_CHANGES.md](./04_API_CONTRACT_CHANGES.md)
6. [05_ADMIN_AND_SETUP_UX.md](./05_ADMIN_AND_SETUP_UX.md)
7. [06_PLANNER_ADAPTATION_WAVE1.md](./06_PLANNER_ADAPTATION_WAVE1.md)
8. [07_PROFILE_PACKS_IB_BRITISH_AMERICAN_SG.md](./07_PROFILE_PACKS_IB_BRITISH_AMERICAN_SG.md)
9. [08_INTEGRATIONS_GOOGLE_LTI_ONEROSTER.md](./08_INTEGRATIONS_GOOGLE_LTI_ONEROSTER.md)
10. [09_TEST_STRATEGY_AND_ACCEPTANCE.md](./09_TEST_STRATEGY_AND_ACCEPTANCE.md)
11. [10_ROLLOUT_BACKFILL_FEATURE_FLAGS.md](./10_ROLLOUT_BACKFILL_FEATURE_FLAGS.md)
12. [11_CODEX_EXECUTION_PLAYBOOK.md](./11_CODEX_EXECUTION_PLAYBOOK.md)
13. [12_RISK_REGISTER.md](./12_RISK_REGISTER.md)

## Recommended Execution Order
1. `00_MASTER_PLAN.md`
2. `02_ARCHITECTURE_DECISIONS.md`
3. `03_DATA_MODEL_AND_MIGRATIONS.md`
4. `04_API_CONTRACT_CHANGES.md`
5. `07_PROFILE_PACKS_IB_BRITISH_AMERICAN_SG.md`
6. `05_ADMIN_AND_SETUP_UX.md`
7. `06_PLANNER_ADAPTATION_WAVE1.md`
8. `08_INTEGRATIONS_GOOGLE_LTI_ONEROSTER.md`
9. `09_TEST_STRATEGY_AND_ACCEPTANCE.md`
10. `10_ROLLOUT_BACKFILL_FEATURE_FLAGS.md`
11. `11_CODEX_EXECUTION_PLAYBOOK.md`
12. `12_RISK_REGISTER.md`

## Exit Conditions for This Pack
- Admin-only curriculum governance is enforced in API, UI, and tests.
- Non-admin roles receive only derived curriculum context in planner/course experiences.
- Additive schema and API changes are backward compatible.
- Google, LTI, and OneRoster paths consume resolved context without becoming configuration authorities.
