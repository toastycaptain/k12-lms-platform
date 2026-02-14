FactoryBot.define do
  factory :school do
    association :tenant
    sequence(:name) { |n| "School #{n}" }
    address { "123 Main St, City, State 12345" }
    timezone { "America/New_York" }
  end
end
