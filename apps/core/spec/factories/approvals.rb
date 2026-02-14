FactoryBot.define do
  factory :approval do
    association :tenant
    association :requested_by, factory: :user
    association :approvable, factory: :unit_plan
    status { "pending" }
  end
end
