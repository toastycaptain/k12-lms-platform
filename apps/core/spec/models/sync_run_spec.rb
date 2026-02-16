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
      expect(run.started_at).to be_present

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
      expect(run.completed_at).to be_present
    end

    it "raises when start! is called from non-pending state" do
      run = create(:sync_run, tenant: tenant, status: "running")

      expect { run.start! }.to raise_error(ActiveRecord::RecordInvalid)
    end

    it "raises when complete! is called from non-running state" do
      run = create(:sync_run, tenant: tenant, status: "pending")

      expect { run.complete! }.to raise_error(ActiveRecord::RecordInvalid)
    end

    it "raises when fail! is called from non-running state" do
      run = create(:sync_run, tenant: tenant, status: "pending")

      expect { run.fail!("boom") }.to raise_error(ActiveRecord::RecordInvalid)
    end
  end

  describe "log helpers" do
    it "creates log entries with levels and metadata" do
      run = create(:sync_run, tenant: tenant)

      run.log_info("i", entity_type: "course", entity_id: 1, external_id: "ext-1", metadata: { "k" => "v" }, ignored: true)
      run.log_warn("w")
      run.log_error("e")

      levels = run.sync_logs.order(:id).pluck(:level)
      expect(levels).to eq([ "info", "warn", "error" ])

      first_log = run.sync_logs.order(:id).first
      expect(first_log.entity_type).to eq("course")
      expect(first_log.entity_id.to_s).to eq("1")
      expect(first_log.external_id).to eq("ext-1")
      expect(first_log.metadata).to eq({ "k" => "v" })
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
