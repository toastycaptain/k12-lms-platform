FactoryBot.define do
  factory :ib_pilot_profile do
    association :tenant
    school { association(:school, tenant: tenant) }
    academic_year { association(:academic_year, tenant: tenant) }
    created_by { association(:user, tenant: tenant) }
    sequence(:name) { |n| "Pilot Cohort #{n}" }
    status { "draft" }
    sequence(:cohort_key) { |n| "cohort-#{n}" }
    archetype_key { "continuum" }
    programme_scope { "Mixed" }
    launch_window { "Spring 2026" }
    go_live_target_on { Date.current + 30.days }
    role_success_metrics { {} }
    baseline_summary { {} }
    readiness_summary { {} }
    rollout_bundle { {} }
    metadata { {} }
  end

  factory :ib_pilot_baseline_snapshot do
    association :tenant
    school { association(:school, tenant: tenant) }
    ib_pilot_profile { association(:ib_pilot_profile, tenant: tenant, school: school) }
    captured_by { association(:user, tenant: tenant) }
    status { "captured" }
    captured_at { Time.current }
    metric_payload { {} }
    benchmark_payload { {} }
    metadata { {} }
  end

  factory :ib_pilot_feedback_item do
    association :tenant
    school { association(:school, tenant: tenant) }
    ib_pilot_profile { association(:ib_pilot_profile, tenant: tenant, school: school) }
    user { association(:user, tenant: tenant) }
    status { "new" }
    sentiment { "neutral" }
    category { "general" }
    role_scope { "teacher" }
    surface { "rollout_console" }
    sequence(:title) { |n| "Pilot Feedback #{n}" }
    detail { "Pilot support note." }
    tags { [] }
    routing_payload { {} }
    metadata { {} }
  end

  factory :ib_migration_session do
    association :tenant
    school { association(:school, tenant: tenant) }
    academic_year { association(:academic_year, tenant: tenant) }
    ib_pilot_profile { association(:ib_pilot_profile, tenant: tenant, school: school, academic_year: academic_year) }
    initiated_by { association(:user, tenant: tenant) }
    ib_import_batch { association(:ib_import_batch, tenant: tenant, school: school, academic_year: academic_year, initiated_by: initiated_by) }
    source_system { "toddle" }
    status { "discovered" }
    cutover_state { "discovered" }
    sequence(:session_key) { |n| "migration-#{n}" }
    source_inventory { {} }
    mapping_summary { {} }
    dry_run_summary { {} }
    reconciliation_summary { {} }
    rollback_summary { {} }
    metadata { {} }
  end

  factory :ib_migration_mapping_template do
    association :tenant
    school { association(:school, tenant: tenant) }
    created_by { association(:user, tenant: tenant) }
    source_system { "managebac" }
    programme { "Mixed" }
    sequence(:name) { |n| "Mapping Template #{n}" }
    status { "draft" }
    shared { false }
    field_mappings { {} }
    transform_library { {} }
    role_mapping_rules { {} }
    metadata { {} }
  end

  factory :ib_report_cycle do
    association :tenant
    school { association(:school, tenant: tenant) }
    academic_year { association(:academic_year, tenant: tenant) }
    created_by { association(:user, tenant: tenant) }
    owner { association(:user, tenant: tenant) }
    programme { "Mixed" }
    sequence(:cycle_key) { |n| "cycle-#{n}" }
    status { "draft" }
    starts_on { Date.current }
    ends_on { Date.current + 7.days }
    due_on { Date.current + 5.days }
    delivery_window { {} }
    localization_settings { {} }
    approval_summary { {} }
    metrics { {} }
    metadata { {} }
  end

  factory :ib_report_template do
    association :tenant
    school { association(:school, tenant: tenant) }
    created_by { association(:user, tenant: tenant) }
    programme { "Mixed" }
    audience { "guardian" }
    family { "conference_packet" }
    sequence(:name) { |n| "Report Template #{n}" }
    status { "draft" }
    schema_version { "phase9.v1" }
    section_definitions { {} }
    translation_rules { {} }
    metadata { {} }
  end

  factory :ib_collaboration_event do
    association :tenant
    school { association(:school, tenant: tenant) }
    curriculum_document
    ib_collaboration_session { nil }
    user { association(:user, tenant: tenant) }
    event_name { "replay_event" }
    route_id { "ib.review" }
    scope_key { "root" }
    section_key { "overview" }
    durable { true }
    payload { {} }
    occurred_at { Time.current }
  end

  factory :ib_collaboration_task do
    association :tenant
    school { association(:school, tenant: tenant) }
    curriculum_document
    created_by { association(:user, tenant: tenant) }
    assigned_to { association(:user, tenant: tenant) }
    status { "open" }
    priority { "medium" }
    sequence(:title) { |n| "Collaboration Task #{n}" }
    detail { "Review the collaboration follow-up." }
    due_on { Date.current + 2.days }
    section_key { "overview" }
    mention_payload { {} }
    metadata { {} }
  end

  factory :ib_benchmark_snapshot do
    association :tenant
    school { association(:school, tenant: tenant) }
    ib_pilot_profile { association(:ib_pilot_profile, tenant: tenant, school: school) }
    captured_by { association(:user, tenant: tenant) }
    benchmark_version { "phase9.v1" }
    status { "baseline" }
    role_scope { "teacher" }
    workflow_family { "planning" }
    captured_at { Time.current }
    metrics { {} }
    thresholds { {} }
    metadata { {} }
  end

  factory :ib_intelligence_metric_definition do
    association :tenant
    school { association(:school, tenant: tenant) }
    created_by { association(:user, tenant: tenant) }
    sequence(:key) { |n| "metric-#{n}" }
    status { "active" }
    metric_family { "programme_health" }
    sequence(:label) { |n| "Metric #{n}" }
    definition { "Tracks a pilot metric." }
    version { "phase9.v1" }
    source_of_truth { {} }
    threshold_config { {} }
    metadata { {} }
  end

  factory :ib_trust_policy do
    association :tenant
    school { association(:school, tenant: tenant) }
    created_by { association(:user, tenant: tenant) }
    audience { "guardian" }
    content_type { "story" }
    status { "active" }
    cadence_mode { "weekly_digest" }
    delivery_mode { "digest" }
    approval_mode { "teacher_reviewed" }
    policy_rules { {} }
    privacy_rules { {} }
    localization_rules { {} }
    metadata { {} }
  end

  factory :ib_mobile_sync_diagnostic do
    association :tenant
    school { association(:school, tenant: tenant) }
    user { association(:user, tenant: tenant) }
    device_class { "phone" }
    workflow_key { "quick_contribution" }
    status { "healthy" }
    queue_depth { 0 }
    last_synced_at { Time.current }
    failure_payload { {} }
    diagnostics { {} }
    metadata { {} }
  end

  factory :ib_search_profile do
    association :tenant
    school { association(:school, tenant: tenant) }
    created_by { association(:user, tenant: tenant) }
    sequence(:key) { |n| "search-profile-#{n}" }
    status { "active" }
    latency_budget_ms { 800 }
    facet_config { {} }
    ranking_rules { {} }
    scope_rules { {} }
    metadata { {} }
  end

  factory :ib_replacement_readiness_snapshot do
    association :tenant
    school { association(:school, tenant: tenant) }
    ib_pilot_profile { association(:ib_pilot_profile, tenant: tenant, school: school) }
    captured_by { association(:user, tenant: tenant) }
    status { "yellow" }
    generated_at { Time.current }
    readiness_summary { {} }
    gap_summary { {} }
    export_payload { {} }
    metadata { {} }
  end
end
