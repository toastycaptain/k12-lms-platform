require "rails_helper"

RSpec.describe Curriculum::MigrationConnectorSDK do
  it "exposes shared connector contracts for supported import systems" do
    connectors = described_class.connectors

    expect(connectors.keys).to include("generic", "toddle", "managebac")
    expect(connectors["managebac"]).to include(
      :protocol_version,
      :connector,
      :supported_kinds,
      :rollout_mode,
      :rollback_mode,
      :artifact_discovery
    )
  end

  it "reuses the shared manifest instead of pack-specific connector copies" do
    expect(described_class.shared_manifest).to be_present
    expect(described_class.template_generators).to be_present
    expect(described_class.source_artifact_discovery).to be_present
  end
end
