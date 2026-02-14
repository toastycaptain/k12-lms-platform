FactoryBot.define do
  factory :rubric_score do
    association :tenant
    association :submission
    association :rubric_criterion
    points_awarded { 20 }
  end
end
