FactoryBot.define do
  factory :curriculum_document_version_alignment do
    curriculum_document_version
    tenant { curriculum_document_version.tenant }
    standard { association(:standard, tenant: tenant) }
    alignment_type { "aligned" }
    metadata { {} }
  end
end
