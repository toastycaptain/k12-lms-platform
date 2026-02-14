FactoryBot.define do
  factory :question_bank do
    association :tenant
    association :created_by, factory: :user
    sequence(:title) { |n| "Question Bank #{n}" }
    status { "active" }
  end
end
