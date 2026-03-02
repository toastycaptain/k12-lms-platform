require "rails_helper"

RSpec.describe DatabaseRestoreJob, type: :job do
  it "is enqueued in the low queue" do
    expect(described_class.new.queue_name).to eq("low")
  end

  it "aborts if backup record status is not completed or verified" do
    record = create(:backup_record, status: "failed")

    expect(Rails.logger).to receive(:error).with(/has status 'failed'/)
    described_class.perform_now(backup_record_id: record.id)
  end

  it "raises when backup record does not exist" do
    expect {
      described_class.perform_now(backup_record_id: 999_999)
    }.to raise_error(ActiveRecord::RecordNotFound)
  end
end
