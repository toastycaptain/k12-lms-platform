FactoryBot.define do
  factory :course do
    association :tenant
    association :academic_year
    sequence(:name) { |n| "Course #{n}" }
    sequence(:code) { |n| "CS#{n}01" }
    description { "A course description" }
  end
end
