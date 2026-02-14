FactoryBot.define do
  factory :lesson_plan do
    association :tenant
    association :unit_plan
    association :created_by, factory: :user
    sequence(:title) { |n| "Lesson Plan #{n}" }
    position { 0 }
    status { "draft" }
  end
end
