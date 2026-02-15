require "rails_helper"

RSpec.describe SyncLog, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:sync_run) }
  end

  describe "validations" do
    it { should validate_presence_of(:message) }
    it { should validate_inclusion_of(:level).in_array(SyncLog::VALID_LEVELS) }
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      l1 = create(:sync_log, tenant: t1)
      Current.tenant = t2
      create(:sync_log, tenant: t2)

      Current.tenant = t1
      expect(SyncLog.all).to contain_exactly(l1)
    end
  end
end
