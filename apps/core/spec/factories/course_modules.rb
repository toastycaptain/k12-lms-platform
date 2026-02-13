FactoryBot.define do
  factory :course_module do
    association :tenant
    association :course
    sequence(:title) { |n| "Module #{n}" }
    description { "Module description" }
    position { 0 }
    status { "draft" }
  end
end
