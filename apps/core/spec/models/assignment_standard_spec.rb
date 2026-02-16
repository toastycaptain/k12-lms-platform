require "rails_helper"

RSpec.describe AssignmentStandard, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:assignment) }
    it { should belong_to(:standard) }
  end

  describe "validations" do
    it "enforces unique standard per assignment" do
      standard_framework = create(:standard_framework, tenant: tenant)
      standard = create(:standard, tenant: tenant, standard_framework: standard_framework)
      assignment = create(:assignment, tenant: tenant)

      assignment.assignment_standards.create!(tenant: tenant, standard: standard)
      duplicate = assignment.assignment_standards.build(tenant: tenant, standard: standard)

      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:standard_id]).to include("has already been taken")
    end

    it "requires tenant" do
      standard_framework = create(:standard_framework, tenant: tenant)
      standard = create(:standard, tenant: tenant, standard_framework: standard_framework)
      assignment = create(:assignment, tenant: tenant)
      Current.tenant = nil
      record = described_class.new(tenant: nil, assignment: assignment, standard: standard)

      expect(record).not_to be_valid
      expect(record.errors[:tenant]).to be_present
    end
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      framework1 = create(:standard_framework, tenant: t1)
      framework2 = create(:standard_framework, tenant: t2)
      assignment1 = create(:assignment, tenant: t1)
      assignment2 = create(:assignment, tenant: t2)
      standard1 = create(:standard, tenant: t1, standard_framework: framework1)
      standard2 = create(:standard, tenant: t2, standard_framework: framework2)

      Current.tenant = t1
      record1 = described_class.create!(tenant: t1, assignment: assignment1, standard: standard1)
      Current.tenant = t2
      described_class.create!(tenant: t2, assignment: assignment2, standard: standard2)

      Current.tenant = t1
      expect(described_class.all).to contain_exactly(record1)
    end
  end
end
