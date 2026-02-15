FactoryBot.define do
  factory :discussion do
    association :tenant
    association :course
    association :created_by, factory: :user
    sequence(:title) { |n| "Discussion #{n}" }
    description { "Discussion description" }
    status { "open" }
  end
end
