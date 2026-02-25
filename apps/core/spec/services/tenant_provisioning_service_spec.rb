require "rails_helper"

RSpec.describe TenantProvisioningService do
  let(:valid_params) do
    {
      school_name: "Riverside Academy",
      subdomain: "riverside",
      admin_email: "admin@riverside.edu",
      admin_first_name: "Jane",
      admin_last_name: "Smith",
      timezone: "America/Chicago"
    }
  end

  after { Current.tenant = nil }

  describe "#call" do
    it "creates a complete tenant setup" do
      result = described_class.new(valid_params).call

      expect(result[:tenant]).to be_persisted
      expect(result[:tenant].slug).to eq("riverside")
      expect(result[:school]).to be_persisted
      expect(result[:admin].email).to eq("admin@riverside.edu")
      expect(result[:admin].has_role?(:admin)).to be(true)
      expect(result[:academic_year]).to be_persisted
      expect(result[:roles]).to include("admin", "teacher", "student")
      expect(result[:setup_token]).to be_present
    end

    it "creates all default roles" do
      result = described_class.new(valid_params).call
      Current.tenant = result[:tenant]

      expect(Role.pluck(:name).sort).to eq(%w[admin curriculum_lead guardian student teacher])
    end

    it "creates AI task policies" do
      result = described_class.new(valid_params).call
      Current.tenant = result[:tenant]

      expect(AiTaskPolicy.count).to eq(5)
    end

    it "raises on duplicate subdomain" do
      Tenant.create!(name: "Existing", slug: "riverside", settings: {})

      expect { described_class.new(valid_params).call }
        .to raise_error(TenantProvisioningService::ProvisioningError, /already taken/)
    end
  end
end
