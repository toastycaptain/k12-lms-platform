FactoryBot.define do
  factory :unit_version_standard do
    association :tenant
    association :unit_version
    association :standard
  end
end
