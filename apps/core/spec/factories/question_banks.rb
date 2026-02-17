FactoryBot.define do
  factory :question_bank do
    association :tenant
    created_by { association :user, tenant: tenant }
    sequence(:title) { |n| "Question Bank #{n}" }
    status { "active" }
  end
end
