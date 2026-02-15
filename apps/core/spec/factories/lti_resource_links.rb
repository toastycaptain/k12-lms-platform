FactoryBot.define do
  factory :lti_resource_link do
    association :tenant
    association :lti_registration
    course { nil }
    sequence(:title) { |n| "LTI Resource #{n}" }
    description { "LTI resource link" }
    sequence(:url) { |n| "https://tool.example.com/resource/#{n}" }
    custom_params { {} }
  end
end
