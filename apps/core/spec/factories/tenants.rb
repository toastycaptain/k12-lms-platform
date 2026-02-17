FactoryBot.define do
  factory :tenant do
    district { nil }
    sequence(:name) { |n| "Tenant #{n}" }
    sequence(:slug) { |n| "tenant-#{n}" }
    settings { {} }
  end
end
