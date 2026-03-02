FactoryBot.define do
  factory :attendance do
    association :tenant
    association :student, factory: :user
    association :section
    association :recorded_by, factory: :user
    occurred_on { Date.current }
    status { "present" }
    notes { nil }
  end
end
