FactoryBot.define do
  factory :assignment do
    association :tenant
    association :course
    association :created_by, factory: :user
    sequence(:title) { |n| "Assignment #{n}" }
    description { "Assignment description" }
    assignment_type { "written" }
    points_possible { 100 }
    status { "draft" }
  end
end
