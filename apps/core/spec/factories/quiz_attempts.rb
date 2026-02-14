FactoryBot.define do
  factory :quiz_attempt do
    association :tenant
    association :quiz
    association :user
    attempt_number { 1 }
    status { "in_progress" }
    started_at { Time.current }
  end
end
