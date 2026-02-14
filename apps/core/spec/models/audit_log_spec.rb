require "rails_helper"

RSpec.describe AuditLog, type: :model do
  describe "associations" do
    it { should belong_to(:tenant) }
    it { should belong_to(:user).optional }
    it { should belong_to(:auditable).optional }
  end

  describe "validations" do
    let(:tenant) { create(:tenant) }

    before { Current.tenant = tenant }
    after { Current.tenant = nil }

    it { should validate_presence_of(:action) }
    it { should validate_inclusion_of(:action).in_array(AuditLog::VALID_ACTIONS) }
  end

  describe "scopes" do
    let(:tenant) { create(:tenant) }
    let(:user) { create(:user, tenant: tenant) }

    before { Current.tenant = tenant }
    after { Current.tenant = nil }

    it ".for_user filters by user_id" do
      log1 = create(:audit_log, tenant: tenant, user: user)
      create(:audit_log, tenant: tenant, user: create(:user, tenant: tenant))

      expect(AuditLog.for_user(user.id)).to contain_exactly(log1)
    end

    it ".for_action filters by action" do
      log1 = create(:audit_log, tenant: tenant, user: user, action: "create")
      create(:audit_log, tenant: tenant, user: user, action: "update")

      expect(AuditLog.for_action("create")).to contain_exactly(log1)
    end

    it ".recent orders by created_at desc" do
      log1 = create(:audit_log, tenant: tenant, user: user, action: "create")
      log2 = create(:audit_log, tenant: tenant, user: user, action: "update")

      expect(AuditLog.recent.first).to eq(log2)
    end

    it ".for_auditable filters by type and id" do
      log1 = create(:audit_log, tenant: tenant, user: user, auditable_type: "User", auditable_id: user.id)
      create(:audit_log, tenant: tenant, user: user, auditable_type: "Course", auditable_id: 999)

      expect(AuditLog.for_auditable("User", user.id)).to contain_exactly(log1)
    end
  end

  describe "tenant scoping" do
    let(:tenant1) { create(:tenant) }
    let(:tenant2) { create(:tenant) }

    after { Current.tenant = nil }

    it "isolates records by tenant" do
      Current.tenant = tenant1
      create(:audit_log, tenant: tenant1, user: create(:user, tenant: tenant1))

      Current.tenant = tenant2
      create(:audit_log, tenant: tenant2, user: create(:user, tenant: tenant2))

      Current.tenant = tenant1
      expect(AuditLog.count).to eq(1)
    end
  end
end
