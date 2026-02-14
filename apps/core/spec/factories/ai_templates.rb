FactoryBot.define do
  factory :ai_template do
    association :tenant
    association :created_by, factory: :user
    task_type { "lesson_generation" }
    name { "Standard Lesson Generator" }
    system_prompt { "You are a K-12 curriculum expert." }
    user_prompt_template { "Generate a lesson plan for {{subject}} covering {{topic}} for grade {{grade_level}}." }
    variables do
      [
        { "name" => "subject", "description" => "Subject area", "required" => true },
        { "name" => "topic", "description" => "Lesson topic", "required" => true },
        { "name" => "grade_level", "description" => "Grade level", "required" => true }
      ]
    end
    status { "draft" }
  end
end
