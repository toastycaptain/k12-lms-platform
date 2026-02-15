FactoryBot.define do
  factory :rubric_criterion do
    association :tenant
    association :rubric
    title { "Criterion" }
    sequence(:position) { |n| n }
    points { 10 }
  end
end
