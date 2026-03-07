FactoryBot.define do
  factory :ib_release_baseline do
    association :tenant
    school { association(:school, tenant: tenant) }
    created_by { association(:user, tenant: tenant) }
    release_channel { "ib-ga-candidate" }
    status { "draft" }
    pack_key { "ib_continuum_v1" }
    pack_version { "2026.2" }
    ci_status { "pending" }
    migration_status { "pending" }
    checklist { {} }
    flag_snapshot { {} }
    dependency_snapshot { {} }
    metadata { {} }
  end

  factory :ib_report do
    association :tenant
    school { association(:school, tenant: tenant) }
    academic_year { association(:academic_year, tenant: tenant) }
    student { association(:user, tenant: tenant) }
    author { association(:user, tenant: tenant) }
    programme { "PYP" }
    report_family { "pyp_narrative" }
    audience { "guardian" }
    status { "draft" }
    sequence(:title) { |n| "IB Report #{n}" }
    summary { "A report summary." }
    source_refs { [] }
    proofing_summary { {} }
    metadata { {} }
  end

  factory :ib_report_version do
    association :tenant
    ib_report
    version_number { 1 }
    status { "rendered" }
    template_key { "ib.reporting.pyp_narrative.guardian.v1" }
    content_payload { { "sections" => [] } }
    render_payload { { "format" => "html" } }
    proofing_summary { {} }
    metadata { {} }
  end

  factory :ib_collaboration_session do
    association :tenant
    school { association(:school, tenant: tenant) }
    curriculum_document
    user { association(:user, tenant: tenant) }
    sequence(:session_key) { |n| "session-#{n}" }
    scope_type { "document" }
    scope_key { "root" }
    status { "active" }
    role { "editor" }
    device_label { "web" }
    last_seen_at { Time.current }
    expires_at { 2.minutes.from_now }
    metadata { {} }
  end

  factory :ib_saved_search do
    association :tenant
    school { association(:school, tenant: tenant) }
    user { association(:user, tenant: tenant) }
    sequence(:name) { |n| "Saved search #{n}" }
    query { "reflection" }
    lens_key { "custom" }
    scope_key { "ib" }
    share_token { SecureRandom.hex(10) }
    filters { {} }
    metadata { {} }
    last_run_at { Time.current }
  end

  factory :ib_communication_preference do
    association :tenant
    school { association(:school, tenant: tenant) }
    user { association(:user, tenant: tenant) }
    audience { "guardian" }
    locale { "en" }
    digest_cadence { "weekly_digest" }
    quiet_hours_start { "20:00" }
    quiet_hours_end { "07:00" }
    quiet_hours_timezone { "UTC" }
    delivery_rules { {} }
    metadata { {} }
  end

  factory :ib_delivery_receipt do
    association :tenant
    school { association(:school, tenant: tenant) }
    user { association(:user, tenant: tenant) }
    deliverable_type { "IbReport" }
    deliverable_id { 1 }
    audience_role { "guardian" }
    state { "delivered" }
    locale { "en" }
    metadata { {} }
  end
end
