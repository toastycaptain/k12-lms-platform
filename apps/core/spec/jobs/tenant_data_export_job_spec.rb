require "rails_helper"

RSpec.describe TenantDataExportJob, type: :job do
  let(:tenant) { create(:tenant) }
  let(:user) { create(:user, tenant: tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "#perform" do
    it "attaches a zip file to the tenant" do
      # Create some data
      academic_year = create(:academic_year, tenant: tenant)
      create(:course, tenant: tenant, academic_year: academic_year)

      described_class.new.perform(tenant.id)

      tenant.reload
      expect(tenant.data_export).to be_attached
      expect(tenant.data_export.filename.to_s).to start_with("tenant_export_#{tenant.slug}")
    end
  end
end
