require "rails_helper"

RSpec.describe DataImportService do
  let!(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:admin)
    Current.tenant = nil
    user
  end

  after { Current.tenant = nil }

  describe "users import" do
    let(:csv_content) do
      <<~CSV
        email,first_name,last_name,role
        teacher1@school.edu,Alice,Johnson,teacher
        student1@school.edu,Bob,Smith,student
      CSV
    end

    it "creates users with roles" do
      result = described_class.new(
        tenant,
        import_type: "users",
        csv_content: csv_content,
        imported_by: admin
      ).call

      expect(result[:created]).to eq(2)
      expect(result[:errors]).to be_empty

      Current.tenant = tenant
      alice = User.find_by(email: "teacher1@school.edu")
      expect(alice).to be_present
      expect(alice.has_role?(:teacher)).to be(true)
    end

    it "reports errors for invalid emails" do
      csv = "email,first_name,last_name,role\n,Alice,Johnson,teacher\n"
      result = described_class.new(
        tenant,
        import_type: "users",
        csv_content: csv,
        imported_by: admin
      ).call

      expect(result[:errors].length).to eq(1)
      expect(result[:errors].first[:error]).to include("Invalid")
    end
  end

  describe "invalid import type" do
    it "raises ImportError" do
      expect do
        described_class.new(
          tenant,
          import_type: "invalid",
          csv_content: "a,b\n1,2",
          imported_by: admin
        ).call
      end.to raise_error(DataImportService::ImportError)
    end
  end
end
