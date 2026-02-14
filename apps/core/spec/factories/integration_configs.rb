FactoryBot.define do
  factory :integration_config do
    association :tenant
    association :created_by, factory: :user
    provider { "google_classroom" }
    status { "inactive" }
    settings { { "classroom_enabled" => true, "drive_enabled" => true, "auto_sync_enabled" => false, "sync_interval_hours" => 24, "domain" => "school.edu" } }

    trait :oneroster do
      provider { "oneroster" }
      settings do
        {
          "base_url" => "https://oneroster.example.com",
          "client_id" => "test_client_id",
          "client_secret" => "test_client_secret",
          "auto_sync_enabled" => false,
          "sync_interval_hours" => 24
        }
      end
    end
  end
end
