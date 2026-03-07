require "rails_helper"

RSpec.describe Ib::Support::PilotSetupStatusEngine do
  let(:tenant) do
    create(
      :tenant,
      settings: {
        "curriculum_default_profile_key" => "ib_continuum_v1",
        "curriculum_default_profile_version" => "2026.2"
      }
    )
  end
  let(:school) { create(:school, tenant: tenant) }
  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:admin)
    Current.tenant = nil
    user
  end

  before do
    create(:academic_year, tenant: tenant, current: true)
    create(:notification_preference, tenant: tenant, user: admin, event_type: "ib_story_published")
    FeatureFlag.create!(tenant: tenant, key: "guardian_portal_enabled", enabled: true)
    FeatureFlag::IB_PHASE6_REQUIRED_FLAGS.each do |key|
      FeatureFlag.find_or_create_by!(tenant: tenant, key: key) { |flag| flag.enabled = true }
    end
    allow_any_instance_of(Ib::Support::PilotBaselineService).to receive(:verify).and_return(
      {
        pack_key: "ib_continuum_v1",
        pack_version: "2026.2",
        release_channel: "ib-pilot",
        release_status: "frozen",
        release_frozen: true,
        baseline_applied: true,
        flags: FeatureFlag::IB_PHASE6_REQUIRED_FLAGS.map { |key| { key: key, enabled: true } }
      }
    )
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  it "returns explicit step owners and counts blockers when pilot prerequisites are missing" do
    payload = described_class.new(tenant: tenant, school: school, programme: "Mixed").build

    expect(payload[:steps].map { |step| step[:key] }).to include(
      "identity",
      "pack_and_flags",
      "exports_and_jobs",
    )
    expect(payload[:steps].find { |step| step[:key] == "pack_and_flags" }[:owner]).to eq("support")
    expect(payload[:summary_metrics][:blocker_count]).to be >= 1
    expect(%w[blocked in_progress ready_for_pilot]).to include(payload[:status])
  end
end
