FactoryBot.define do
  factory :lesson_version do
    association :tenant
    association :lesson_plan
    sequence(:version_number) { |n| n }
    sequence(:title) { |n| "Lesson Version #{n}" }
    objectives { "Students will learn..." }
    activities { "Activity 1, Activity 2" }
    materials { "Textbook, Handout" }
    duration_minutes { 45 }
  end
end
