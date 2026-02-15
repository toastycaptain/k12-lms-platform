FactoryBot.define do
  factory :module_item_completion do
    association :tenant
    association :user
    association :module_item
    completed_at { Time.current }
  end
end
