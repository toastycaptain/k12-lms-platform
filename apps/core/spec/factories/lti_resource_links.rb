FactoryBot.define do
  factory :lti_resource_link do
    association :tenant
    association :lti_registration
    sequence(:title) { |n| "Resource Link #{n}" }
    description { "A resource link" }
    url { "https://tool.example.com/launch" }
    custom_params { {} }
  end
end
