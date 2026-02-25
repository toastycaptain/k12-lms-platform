FactoryBot.define do
  factory :backup_record do
    backup_type { "full" }
    status { "completed" }
    sequence(:s3_key) { |n| "backups/test_#{n}.sql.gz" }
    s3_bucket { "test-bucket" }
    size_bytes { 1024 }
    duration_seconds { 5 }
    metadata { {} }
    verification_result { {} }
  end
end
