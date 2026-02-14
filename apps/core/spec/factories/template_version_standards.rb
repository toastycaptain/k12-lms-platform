FactoryBot.define do
  factory :template_version_standard do
    association :tenant
    association :template_version
    association :standard
  end
end
