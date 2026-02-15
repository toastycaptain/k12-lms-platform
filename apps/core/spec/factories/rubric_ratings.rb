FactoryBot.define do
  factory :rubric_rating do
    association :tenant
    association :rubric_criterion
    description { "Excellent" }
    sequence(:position) { |n| n }
    points { 10 }
  end
end
