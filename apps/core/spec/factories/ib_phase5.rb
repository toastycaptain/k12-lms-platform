FactoryBot.define do
  factory :ib_programme_setting do
    association :tenant
    school { association(:school, tenant: tenant) }
    updated_by { association(:user, tenant: tenant) }
    programme { "PYP" }
    cadence_mode { "weekly_digest" }
    review_owner_role { "curriculum_lead" }
    thresholds do
      {
        "approval_sla_days" => 5,
        "review_backlog_limit" => 12,
        "publishing_hold_hours" => 48,
        "digest_batch_limit" => 8
      }
    end
    metadata { {} }

    trait :tenant_default do
      school { nil }
    end
  end

  factory :ib_evidence_item do
    association :tenant
    school { association(:school, tenant: tenant) }
    planning_context { association(:planning_context, tenant: tenant, school: school) }
    curriculum_document { nil }
    curriculum_document_version { nil }
    student { association(:user, tenant: tenant) }
    created_by { association(:user, tenant: tenant) }
    programme { "PYP" }
    status { "needs_validation" }
    visibility { "undecided" }
    contributor_type { "teacher" }
    sequence(:title) { |n| "Evidence Item #{n}" }
    summary { "A notable learning moment." }
    next_action { "Validate and decide visibility." }
    story_draft { "Draft a calm family-facing summary." }
    metadata { {} }
  end

  factory :ib_learning_story do
    association :tenant
    school { association(:school, tenant: tenant) }
    planning_context { association(:planning_context, tenant: tenant, school: school) }
    curriculum_document { nil }
    created_by { association(:user, tenant: tenant) }
    programme { "PYP" }
    state { "draft" }
    cadence { "weekly_digest" }
    audience { "families" }
    sequence(:title) { |n| "Learning Story #{n}" }
    summary { "A concise family-ready summary." }
    support_prompt { "Ask about the strategy used today." }
    metadata { {} }
  end

  factory :ib_publishing_queue_item do
    association :tenant
    school { association(:school, tenant: tenant) }
    ib_learning_story { association(:ib_learning_story, tenant: tenant, school: school) }
    created_by { association(:user, tenant: tenant) }
    state { "draft" }
    scheduled_for { nil }
    delivered_at { nil }
    held_reason { nil }
    metadata { {} }
  end

  factory :ib_publishing_audit do
    association :tenant
    school { association(:school, tenant: tenant) }
    ib_learning_story { association(:ib_learning_story, tenant: tenant, school: school) }
    ib_publishing_queue_item { association(:ib_publishing_queue_item, tenant: tenant, school: school, ib_learning_story: ib_learning_story) }
    changed_by { association(:user, tenant: tenant) }
    event_type { "created" }
    details { {} }
  end

  factory :ib_standards_cycle do
    association :tenant
    school { association(:school, tenant: tenant) }
    academic_year { association(:academic_year, tenant: tenant) }
    coordinator { association(:user, tenant: tenant) }
    sequence(:title) { |n| "Standards Cycle #{n}" }
    status { "open" }
    metadata { {} }
  end

  factory :ib_standards_packet do
    association :tenant
    school { association(:school, tenant: tenant) }
    ib_standards_cycle { association(:ib_standards_cycle, tenant: tenant, school: school) }
    owner { association(:user, tenant: tenant) }
    reviewer { nil }
    sequence(:code) { |n| "STD-#{n}" }
    sequence(:title) { |n| "Packet #{n}" }
    review_state { "draft" }
    evidence_strength { "emerging" }
    export_status { "not_ready" }
    metadata { {} }
  end

  factory :ib_standards_packet_item do
    association :tenant
    ib_standards_packet
    source_type { "IbEvidenceItem" }
    source_id { 1 }
    review_state { "draft" }
    summary { "Supporting evidence summary." }
    relevance_note { "Linked to the standard." }
    metadata { {} }
  end

  factory :ib_standards_export do
    association :tenant
    school { association(:school, tenant: tenant) }
    ib_standards_cycle { association(:ib_standards_cycle, tenant: tenant, school: school) }
    ib_standards_packet { association(:ib_standards_packet, tenant: tenant, school: school, ib_standards_cycle: ib_standards_cycle) }
    initiated_by { association(:user, tenant: tenant) }
    status { "queued" }
    snapshot_payload { { "packet" => { "id" => 1 } } }
    metadata { {} }
  end

  factory :ib_document_comment do
    association :tenant
    curriculum_document
    author { association(:user, tenant: curriculum_document.tenant) }
    parent_comment { nil }
    resolved_by { nil }
    comment_type { "review_note" }
    status { "open" }
    visibility { "coordinator" }
    anchor_path { nil }
    body { "Returned with review feedback." }
    metadata { {} }
  end
end
