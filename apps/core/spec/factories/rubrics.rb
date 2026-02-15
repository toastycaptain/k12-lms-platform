FactoryBot.define do
  factory :rubric do
    association :tenant
    association :created_by, factory: :user
    sequence(:title) { |n| "Rubric #{n}" }
    description { "Rubric description" }
    points_possible { 100 }
  end
end
