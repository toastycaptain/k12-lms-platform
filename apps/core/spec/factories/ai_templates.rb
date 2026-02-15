FactoryBot.define do
  factory :ai_template do
    association :tenant
    association :created_by, factory: :user
    sequence(:name) { |n| "Template #{n}" }
    task_type { "lesson_plan" }
    status { "active" }
    system_prompt { "You are a helpful K-12 education assistant." }
    user_prompt_template { "Generate a {task_type} for {subject} at {grade_level} level." }
    variables { [ "task_type", "subject", "grade_level" ] }
  end
end
