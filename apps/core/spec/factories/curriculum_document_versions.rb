FactoryBot.define do
  factory :curriculum_document_version do
    curriculum_document
    tenant { curriculum_document.tenant }
    created_by { association(:user, tenant: tenant) }
    sequence(:version_number) { |n| n }
    sequence(:title) { |n| "Version #{n}" }
    content { { "title" => "Draft" } }
  end
end
