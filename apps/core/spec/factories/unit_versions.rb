FactoryBot.define do
  factory :unit_version do
    association :tenant
    association :unit_plan
    sequence(:version_number) { |n| n }
    sequence(:title) { |n| "Version #{n}" }
    description { "A version description" }
    essential_questions { [ "What is the big idea?" ] }
    enduring_understandings { [ "Students will understand..." ] }
  end
end
