FactoryBot.define do
  factory :grade_category do
    association :tenant
    association :course
    sequence(:name) { |n| "Category #{n}" }
    weight_percentage { 25 }
  end
end
