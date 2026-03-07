FactoryBot.define do
  factory :ib_pilot_setup do
    association :tenant
    school { association(:school, tenant: tenant) }
    programme { "Mixed" }
    status { "in_progress" }
    feature_flag_bundle { {} }
    setup_steps { {} }
    owner_assignments { {} }
    status_details { {} }
    baseline_metadata { {} }
    paused_reason { nil }
    last_validated_at { nil }
    activated_at { nil }
    paused_at { nil }
    retired_at { nil }
    created_by { association(:user, tenant: tenant) }
    updated_by { association(:user, tenant: tenant) }
  end

  factory :ib_import_batch do
    association :tenant
    school { association(:school, tenant: tenant) }
    academic_year { association(:academic_year, tenant: tenant) }
    programme { "Mixed" }
    status { "staged" }
    source_kind { "curriculum_document" }
    source_format { "csv" }
    source_filename { "ib-import.csv" }
    raw_payload { "planning_context_name,title\nGrade 5 PYP,Imported Unit" }
    scope_metadata { {} }
    mapping_payload { {} }
    validation_summary { {} }
    dry_run_summary { {} }
    execution_summary { {} }
    rollback_summary { {} }
    parser_warnings { [] }
    error_message { nil }
    initiated_by { association(:user, tenant: tenant) }
    executed_by { nil }
  end

  factory :ib_import_row do
    association :tenant
    ib_import_batch
    row_index { 2 }
    sheet_name { "csv" }
    source_identifier { "csv:2" }
    status { "staged" }
    source_payload { { "title" => "Imported Unit" } }
    normalized_payload { { "planning_context_name" => "Grade 5 PYP", "title" => "Imported Unit" } }
    mapping_payload { {} }
    warnings { [] }
    error_messages { [] }
    conflict_payload { {} }
    execution_payload { {} }
    target_entity_ref { nil }
  end
end
