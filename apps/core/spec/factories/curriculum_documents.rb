FactoryBot.define do
  factory :curriculum_document do
    planning_context
    tenant { planning_context.tenant }
    school { planning_context.school }
    academic_year { planning_context.academic_year }
    created_by { association(:user, tenant: tenant) }
    document_type { "unit_plan" }
    sequence(:title) { |n| "Curriculum Document #{n}" }
    status { "draft" }
    pack_key { "american_common_core_v1" }
    pack_version { "2026.1" }
    schema_key { "us.unit@v1" }
    settings { {} }
    metadata { {} }
  end
end
