FactoryBot.define do
  factory :announcement do
    association :tenant
    association :course
    association :created_by, factory: :user
    sequence(:title) { |n| "Announcement #{n}" }
    message { "Important announcement" }
    published_at { Time.current }
  end
end
