FactoryBot.define do
  factory :question do
    association :tenant
    association :question_bank
    association :created_by, factory: :user
    question_type { "multiple_choice" }
    prompt { "What is 2 + 2?" }
    choices { [ { "text" => "3", "key" => "a" }, { "text" => "4", "key" => "b" }, { "text" => "5", "key" => "c" } ] }
    correct_answer { { "key" => "b" } }
    points { 1.0 }
    status { "active" }

    trait :true_false do
      question_type { "true_false" }
      prompt { "The Earth is round." }
      choices { [] }
      correct_answer { { "value" => true } }
    end

    trait :short_answer do
      question_type { "short_answer" }
      prompt { "What is the capital of France?" }
      choices { [] }
      correct_answer { { "acceptable" => [ "Paris", "paris" ] } }
    end

    trait :essay do
      question_type { "essay" }
      prompt { "Explain the water cycle." }
      choices { [] }
      correct_answer { {} }
    end

    trait :matching do
      question_type { "matching" }
      prompt { "Match the terms to their definitions." }
      choices { [ { "left" => "H2O", "right" => "Water" }, { "left" => "NaCl", "right" => "Salt" } ] }
      correct_answer { { "pairs" => [ { "left" => "H2O", "right" => "Water" }, { "left" => "NaCl", "right" => "Salt" } ] } }
    end

    trait :fill_in_blank do
      question_type { "fill_in_blank" }
      prompt { "The {{blank}} is the largest planet." }
      choices { [] }
      correct_answer { { "answers" => [ "Jupiter" ] } }
    end
  end
end
