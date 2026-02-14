FactoryBot.define do
  factory :quiz_item do
    association :tenant
    association :quiz
    association :question
    position { 0 }
    points { 1.0 }
  end
end
