FactoryBot.define do
  factory :quiz_accommodation do
    association :tenant
    association :quiz
    association :user
    extra_time_minutes { 30 }
    extra_attempts { 1 }
  end
end
