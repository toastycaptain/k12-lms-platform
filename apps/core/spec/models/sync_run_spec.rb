require "rails_helper"

RSpec.describe SyncRun, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:integration_config) }
    it { should belong_to(:triggered_by).class_name("User").optional }
    it { should have_many(:sync_logs).dependent(:destroy) }
  end

  describe "validations" do
    it { should validate_inclusion_of(:sync_type).in_array(SyncRun::VALID_SYNC_TYPES) }
    it { should validate_inclusion_of(:direction).in_array(SyncRun::VALID_DIRECTIONS) }
    it { should validate_inclusion_of(:status).in_array(SyncRun::VALID_STATUSES) }
  end

  describe "state methods" do
    it "transitions pending -> running -> completed" do
      run = create(:sync_run, tenant: tenant, status: "pending")
      run.start!
      expect(run.reload.status).to eq("running")

      run.complete!
      expect(run.reload.status).to eq("completed")
      expect(run.completed_at).to be_present
    end

    it "fails with message from running" do
      run = create(:sync_run, tenant: tenant, status: "pending")
      run.start!
      run.fail!("boom")
      expect(run.reload.status).to eq("failed")
      expect(run.error_message).to eq("boom")
    end
  end

  describe "log helpers" do
    it "creates log entries with levels" do
      run = create(:sync_run, tenant: tenant)
      run.log_info("i")
      run.log_warn("w")
      run.log_error("e")

      expect(run.sync_logs.pluck(:level)).to contain_exactly("info", "warn", "error")
    end
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      r1 = create(:sync_run, tenant: t1)
      Current.tenant = t2
      create(:sync_run, tenant: t2)

      Current.tenant = t1
      expect(SyncRun.all).to contain_exactly(r1)
    end
  end
end
