# Research Benchmarks and Product Implications

## Purpose
Summarize practical curriculum and LMS patterns for IB, British, American, and Singapore contexts, then convert those patterns into implementation guidance for this platform.

## Curriculum Benchmarks
### IB (PYP/MYP/DP/CP)
Observed platform usage pattern:
- Schools commonly favor planner-led systems with strong standards/criterion mapping and approval workflows.
- Emphasis on inquiry structure, unit-level conceptual framing, and criterion-based planning language.

Implications for this LMS:
- Profile must support IB-flavored planner taxonomy labels.
- Standards defaults should map to IB framework sets when configured.
- Keep grading parity out of v1, but include profile hints for future 1-7 pathway support.

### British (National Curriculum / Cambridge pathways)
Observed platform usage pattern:
- Strong stage/key-stage/course pathway orientation.
- Institutions need clear mapping from course content to stage-linked standards and outcomes.

Implications:
- Profile must support stage-based labels and framework defaults.
- Course/planner filters should expose profile-derived stage/subject options.

### American (Common Core / NGSS / state variation)
Observed pattern:
- Standards alignment is typically dense and operationally central.
- Teachers expect quick standards browsing and assignment/unit mapping workflows.

Implications:
- Preserve and optimize standards alignment UX.
- American profile should be practical fallback for tenants without explicit profile selection.

### Singapore (MOE-aligned)
Observed pattern:
- Nationally structured syllabus alignment and centralized platform conventions.
- High emphasis on curriculum consistency and implementation fidelity.

Implications:
- Singapore profile should provide syllabus-style defaults and concise taxonomy.
- Enforce admin-led setup to keep consistency across schools.

## Widely Used LMS Pattern Takeaways
- IB-heavy institutions often use curriculum-first systems.
- American institutions broadly rely on LMS + standards workflows.
- British/Singapore institutions need reliable, centrally managed structure.

## Product-Level Implications
1. Profile-driven adaptation must be configuration-based, not page-by-page hardcoding.
2. Admin governance is required for institutional consistency.
3. Non-admin user experience should remain simple: consume derived defaults.
4. Integrations should receive effective curriculum context as metadata, not configuration authority.
