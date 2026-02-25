require "rails_helper"

RSpec.describe BackupRecord, type: :model do
  describe "validations" do
    it "rejects invalid backup_type" do
      record = described_class.new(backup_type: "invalid", status: "in_progress", s3_key: "x", s3_bucket: "y")
      expect(record).not_to be_valid
    end

    it "rejects invalid status" do
      record = described_class.new(backup_type: "full", status: "invalid", s3_key: "x", s3_bucket: "y")
      expect(record).not_to be_valid
    end
  end

  describe "#mark_completed!" do
    it "updates status and metadata fields" do
      record = described_class.create!(backup_type: "full", status: "in_progress", s3_key: "x", s3_bucket: "y")

      record.mark_completed!(size: 1024, duration: 60, metadata: { "pg_version" => "16" })

      expect(record.status).to eq("completed")
      expect(record.size_bytes).to eq(1024)
      expect(record.duration_seconds).to eq(60)
      expect(record.metadata["pg_version"]).to eq("16")
    end
  end

  describe "#size_mb" do
    it "converts bytes to megabytes" do
      record = described_class.new(size_bytes: 10_485_760)
      expect(record.size_mb).to eq(10.0)
    end
  end
end
