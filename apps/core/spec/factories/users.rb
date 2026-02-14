FactoryBot.define do
  factory :user do
    association :tenant
    sequence(:email) { |n| "user#{n}@example.com" }
    first_name { "John" }
    last_name { "Doe" }
  end
end
