FactoryBot.define do
  factory :submission do
    association :tenant
    association :assignment
    association :user
    submission_type { "text" }
    body { "My submission" }
    status { "draft" }
  end
end
