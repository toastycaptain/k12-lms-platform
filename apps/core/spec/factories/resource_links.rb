FactoryBot.define do
  factory :resource_link do
    association :tenant
    association :linkable, factory: :unit_version
    sequence(:url) { |n| "https://docs.google.com/document/d/abc#{n}" }
    sequence(:title) { |n| "Resource #{n}" }
    mime_type { "application/pdf" }
    provider { "url" }
    link_type { "reference" }
    metadata { {} }

    trait :google_drive do
      provider { "google_drive" }
      sequence(:drive_file_id) { |n| "drive_file_#{n}" }
    end
  end
end
