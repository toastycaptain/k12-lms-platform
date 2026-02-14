FactoryBot.define do
  factory :quiz do
    association :tenant
    association :course
    association :created_by, factory: :user
    sequence(:title) { |n| "Quiz #{n}" }
    quiz_type { "standard" }
    status { "draft" }
    attempts_allowed { 1 }
  end
end
