FactoryBot.define do
  factory :discussion_post do
    association :tenant
    association :discussion
    association :created_by, factory: :user
    content { "This is a discussion post." }
  end
end
