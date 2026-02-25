require "rails_helper"

RSpec.describe DatabaseBackupJob, type: :job do
  it "is enqueued in the low queue" do
    expect(described_class.new.queue_name).to eq("low")
  end

  it "can be enqueued" do
    expect do
      described_class.perform_later(backup_type: "full")
    end.to have_enqueued_job(described_class)
  end
end
