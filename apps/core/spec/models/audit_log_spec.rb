require "rails_helper"

RSpec.describe AuditLog, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  it "requires an event_type" do
    log = build(:audit_log, tenant: tenant, event_type: nil)

    expect(log).not_to be_valid
    expect(log.errors[:event_type]).to be_present
  end

  it "is immutable after creation" do
    log = create(:audit_log, tenant: tenant)

    expect { log.update!(event_type: "changed.event") }.to raise_error(ActiveRecord::ReadOnlyRecord)
    expect { log.destroy! }.to raise_error(ActiveRecord::ReadOnlyRecord)
  end
end
