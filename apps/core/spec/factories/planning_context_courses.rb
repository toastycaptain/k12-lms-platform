FactoryBot.define do
  factory :planning_context_course do
    association :tenant
    association :planning_context
    association :course
  end
end
