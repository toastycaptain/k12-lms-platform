FactoryBot.define do
  factory :attempt_answer do
    association :tenant
    association :quiz_attempt
    association :question
    answer { { "key" => "b" } }
  end
end
