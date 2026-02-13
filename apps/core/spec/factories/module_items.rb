FactoryBot.define do
  factory :module_item do
    association :tenant
    association :course_module
    sequence(:title) { |n| "Item #{n}" }
    item_type { "resource" }
    position { 0 }
  end
end
