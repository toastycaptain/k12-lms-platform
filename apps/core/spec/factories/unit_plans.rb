FactoryBot.define do
  factory :unit_plan do
    association :tenant
    association :course
    association :created_by, factory: :user
    sequence(:title) { |n| "Unit Plan #{n}" }
    status { "draft" }
  end
end
