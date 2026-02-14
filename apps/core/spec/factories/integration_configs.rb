FactoryBot.define do
  factory :integration_config do
    association :tenant
    association :created_by, factory: :user
    provider { "google_classroom" }
    status { "inactive" }
    settings { { "classroom_enabled" => true, "drive_enabled" => true, "auto_sync_enabled" => false, "sync_interval_hours" => 24, "domain" => "school.edu" } }
  end
end
