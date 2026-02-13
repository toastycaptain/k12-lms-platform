FactoryBot.define do
  factory :section do
    association :tenant
    association :course
    association :term
    sequence(:name) { |n| "Section #{n}" }
  end
end
