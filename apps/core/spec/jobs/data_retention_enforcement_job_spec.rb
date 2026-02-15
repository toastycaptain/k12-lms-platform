require "rails_helper"

RSpec.describe DataRetentionEnforcementJob, type: :job do
  let(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:admin)
    Current.tenant = nil
    user
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  it "deletes records older than the retention window for delete policies" do
    Current.tenant = tenant
    old_log = create(:audit_log, tenant: tenant, actor: admin, event_type: "old.event")
    new_log = create(:audit_log, tenant: tenant, actor: admin, event_type: "new.event")
    policy = create(
      :data_retention_policy,
      tenant: tenant,
      created_by: admin,
      entity_type: "AuditLog",
      action: "delete",
      retention_days: 60
    )
    Current.tenant = nil

    old_log.update_column(:created_at, 90.days.ago)

    described_class.perform_now(policy.id)

    expect(AuditLog.unscoped.find_by(id: old_log.id)).to be_nil
    expect(AuditLog.unscoped.find_by(id: new_log.id)).to be_present
    expect(
      AuditLog.unscoped.where(tenant_id: tenant.id, event_type: "retention.policy_enforced")
    ).to exist
  end

  it "archives old records when archived_at is available" do
    Current.tenant = tenant
    config = create(:integration_config, tenant: tenant, created_by: admin)
    sync_run = create(:sync_run, tenant: tenant, integration_config: config, triggered_by: admin)
    sync_log = create(:sync_log, tenant: tenant, sync_run: sync_run, message: "old sync log")
    policy = create(
      :data_retention_policy,
      tenant: tenant,
      created_by: admin,
      entity_type: "SyncLog",
      action: "archive",
      retention_days: 30
    )
    Current.tenant = nil

    sync_log.update_column(:created_at, 40.days.ago)

    described_class.perform_now(policy.id)

    expect(sync_log.reload.archived_at).to be_present
  end

  it "anonymizes old records for anonymize policies" do
    Current.tenant = tenant
    log = create(
      :audit_log,
      tenant: tenant,
      actor: admin,
      event_type: "pii.event",
      ip_address: "203.0.113.5",
      user_agent: "Mozilla/5.0",
      metadata: { note: "sensitive" }
    )
    policy = create(
      :data_retention_policy,
      tenant: tenant,
      created_by: admin,
      entity_type: "AuditLog",
      action: "anonymize",
      retention_days: 15
    )
    Current.tenant = nil

    log.update_column(:created_at, 30.days.ago)

    described_class.perform_now(policy.id)

    log.reload
    expect(log.ip_address).to eq("0.0.0.0")
    expect(log.user_agent).to eq("[REDACTED]")
    expect(log.metadata).to eq({})
  end
end
