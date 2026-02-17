require "rails_helper"

RSpec.describe GuardianLink, type: :model do
  let(:tenant) { create(:tenant) }

  subject(:guardian_link) { build(:guardian_link, tenant: tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:guardian).class_name("User") }
    it { should belong_to(:student).class_name("User") }
  end

  describe "validations" do
    it { should validate_presence_of(:relationship) }
    it { should validate_presence_of(:status) }
    it { should validate_inclusion_of(:relationship).in_array(GuardianLink::VALID_RELATIONSHIPS) }
    it { should validate_inclusion_of(:status).in_array(GuardianLink::VALID_STATUSES) }
  end

  describe "uniqueness" do
    it "enforces one guardian/student pair per tenant" do
      guardian = create(:user, tenant: tenant)
      student = create(:user, tenant: tenant)
      create(:guardian_link, tenant: tenant, guardian: guardian, student: student)

      duplicate = build(:guardian_link, tenant: tenant, guardian: guardian, student: student)
      different_student = build(:guardian_link, tenant: tenant, guardian: guardian, student: create(:user, tenant: tenant))

      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:student_id]).to include("has already been taken")
      expect(different_student).to be_valid
    end
  end

  describe "custom validations" do
    it "prevents linking a user to themselves" do
      user = create(:user, tenant: tenant)
      link = build(:guardian_link, tenant: tenant, guardian: user, student: user)

      expect(link).not_to be_valid
      expect(link.errors[:student_id]).to include("must differ from guardian")
    end

    it "requires guardian and student to belong to the same tenant" do
      other_tenant = create(:tenant)
      guardian = create(:user, tenant: tenant)
      student = create(:user, tenant: other_tenant)
      link = build(:guardian_link, tenant: tenant, guardian: guardian, student: student)

      expect(link).not_to be_valid
      expect(link.errors[:student_id]).to include("must belong to the same tenant")
    end
  end

  describe ".active" do
    it "returns only active links" do
      active_link = create(:guardian_link, tenant: tenant, status: "active")
      create(:guardian_link, tenant: tenant, status: "inactive")

      expect(described_class.active).to contain_exactly(active_link)
    end
  end
end
