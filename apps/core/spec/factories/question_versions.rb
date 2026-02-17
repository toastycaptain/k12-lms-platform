FactoryBot.define do
  factory :question_version do
    tenant
    question { association :question, tenant: tenant }
    sequence(:version_number) { |n| n }
    question_type { question.question_type }
    content { question.prompt }
    choices { question.choices }
    correct_answer { question.correct_answer }
    explanation { question.explanation }
    points { question.points }
    metadata { {} }
    status { "draft" }
    created_by { association :user, tenant: tenant }
  end
end
