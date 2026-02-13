FactoryBot.define do
  factory :enrollment do
    association :tenant
    association :user
    association :section
    role { "student" }
  end
end
