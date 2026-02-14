FactoryBot.define do
  factory :template do
    association :tenant
    association :created_by, factory: :user
    sequence(:name) { |n| "Template #{n}" }
    status { "draft" }
  end
end
