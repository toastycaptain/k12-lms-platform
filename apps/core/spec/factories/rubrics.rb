FactoryBot.define do
  factory :rubric do
    association :tenant
    association :created_by, factory: :user
    sequence(:title) { |n| "Rubric #{n}" }
    description { "Rubric description" }
    points_possible { 100 }
  end

  factory :rubric_criterion do
    association :tenant
    association :rubric
    sequence(:title) { |n| "Criterion #{n}" }
    points { 25 }
    position { 0 }
  end

  factory :rubric_rating do
    association :tenant
    association :rubric_criterion
    sequence(:description) { |n| "Rating #{n}" }
    points { 25 }
    position { 0 }
  end
end
