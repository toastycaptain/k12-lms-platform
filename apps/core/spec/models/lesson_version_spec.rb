require "rails_helper"

RSpec.describe LessonVersion, type: :model do
  let(:tenant) { create(:tenant) }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:author) { create(:user, tenant: tenant) }
  let(:unit_plan) { create(:unit_plan, tenant: tenant, course: course, created_by: author) }
  let(:lesson_plan) { create(:lesson_plan, tenant: tenant, unit_plan: unit_plan, created_by: author) }

  subject(:lesson_version) { build(:lesson_version, tenant: tenant, lesson_plan: lesson_plan) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it "belongs to tenant through TenantScoped" do
      association = described_class.reflect_on_association(:tenant)

      expect(association).to be_present
      expect(association.macro).to eq(:belongs_to)
      expect(association.options[:optional]).to eq(false)
    end

    it { should belong_to(:lesson_plan) }
    it { should have_many(:resource_links).dependent(:destroy) }
  end

  describe "validations" do
    it { should validate_presence_of(:version_number) }
    it { should validate_presence_of(:title) }

    it "requires tenant_id when Current.tenant is not set" do
      Current.tenant = nil
      record = described_class.new(
        lesson_plan: lesson_plan,
        version_number: 1,
        title: "Draft"
      )

      expect(record).not_to be_valid
      expect(record.errors[:tenant_id]).to include("can't be blank")
    end
  end

  describe "version uniqueness" do
    it "enforces unique version_number per lesson_plan" do
      create(:lesson_version, tenant: tenant, lesson_plan: lesson_plan, version_number: 1, title: "V1")
      duplicate = build(:lesson_version, tenant: tenant, lesson_plan: lesson_plan, version_number: 1, title: "V1 Duplicate")

      alternate_lesson_plan = create_lesson_plan_for(tenant)
      different_plan_version = build(
        :lesson_version,
        tenant: tenant,
        lesson_plan: alternate_lesson_plan,
        version_number: 1,
        title: "V1 In Different Plan"
      )

      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:version_number]).to include("has already been taken")
      expect(different_plan_version).to be_valid
    end
  end

  describe "tenant scoping" do
    it "returns only records for Current.tenant" do
      tenant_one = create(:tenant)
      tenant_two = create(:tenant)

      Current.tenant = tenant_one
      lesson_plan_one = create_lesson_plan_for(tenant_one)
      version_one = create(:lesson_version, tenant: tenant_one, lesson_plan: lesson_plan_one)

      Current.tenant = tenant_two
      lesson_plan_two = create_lesson_plan_for(tenant_two)
      create(:lesson_version, tenant: tenant_two, lesson_plan: lesson_plan_two)

      Current.tenant = tenant_one
      expect(LessonVersion.all).to contain_exactly(version_one)
    end
  end

  private

  def create_lesson_plan_for(target_tenant)
    ay = create(:academic_year, tenant: target_tenant)
    course = create(:course, tenant: target_tenant, academic_year: ay)
    creator = create(:user, tenant: target_tenant)
    unit_plan = create(:unit_plan, tenant: target_tenant, course: course, created_by: creator)
    create(:lesson_plan, tenant: target_tenant, unit_plan: unit_plan, created_by: creator)
  end
end
