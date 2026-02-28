FactoryBot.define do
  factory :goal do
    association :tenant
    association :student, factory: :user
    sequence(:title) { |n| "Goal #{n}" }
    description { "Goal description" }
    status { "active" }
    target_date { 2.weeks.from_now.to_date }
    progress_percent { 0 }
  end
end
