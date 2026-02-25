require "rails_helper"

RSpec.describe BackupVerificationJob, type: :job do
  it "is enqueued in the low queue" do
    expect(described_class.new.queue_name).to eq("low")
  end

  it "skips records that are not completed" do
    record = BackupRecord.create!(
      backup_type: "full",
      status: "failed",
      s3_key: "backups/test.sql.gz",
      s3_bucket: "test-bucket"
    )

    expect { described_class.perform_now(record.id) }.not_to raise_error
    expect(record.reload.status).to eq("failed")
  end
end
