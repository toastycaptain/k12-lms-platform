FactoryBot.define do
  factory :district do
    sequence(:name) { |n| "District #{n}" }
    sequence(:slug) { |n| "district-#{n}" }
    settings { {} }
  end
end
