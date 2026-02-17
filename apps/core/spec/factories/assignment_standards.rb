FactoryBot.define do
  factory :assignment_standard do
    association :tenant
    association :assignment
    association :standard
  end
end
