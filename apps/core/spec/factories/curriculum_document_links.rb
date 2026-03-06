FactoryBot.define do
  factory :curriculum_document_link do
    association :tenant
    association :source_document, factory: :curriculum_document
    association :target_document, factory: :curriculum_document
    relationship_type { "contains" }
    position { 0 }
    metadata { {} }
  end
end
