require "rails_helper"

RSpec.describe SyncMappingPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:admin) { u = create(:user, tenant: tenant); u.add_role(:admin); u }
  let(:curriculum_lead) { u = create(:user, tenant: tenant); u.add_role(:curriculum_lead); u }
  let(:teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:student) { u = create(:user, tenant: tenant); u.add_role(:student); u }

  let(:integration_config) { create(:integration_config, tenant: tenant, created_by: admin) }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:taught_course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:other_course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:taught_section) { create(:section, tenant: tenant, course: taught_course, term: term) }

  let(:visible_record) do
    create(:sync_mapping,
      tenant: tenant,
      integration_config: integration_config,
      local_type: "Course",
      local_id: taught_course.id,
      external_type: "classroom_course")
  end

  let(:hidden_record) do
    create(:sync_mapping,
      tenant: tenant,
      integration_config: integration_config,
      local_type: "Course",
      local_id: other_course.id,
      external_type: "classroom_course")
  end

  before do
    Current.tenant = tenant
    create(:enrollment, tenant: tenant, user: teacher, section: taught_section, role: "teacher")
  end

  after { Current.tenant = nil }

  permissions :index? do
    it "permits privileged users and teachers" do
      expect(policy).to permit(admin, visible_record)
      expect(policy).to permit(curriculum_lead, visible_record)
      expect(policy).to permit(teacher, visible_record)
    end

    it "denies students" do
      expect(policy).not_to permit(student, visible_record)
    end
  end

  permissions :show?, :sync_roster? do
    it "permits privileged users and visible teacher records" do
      expect(policy).to permit(admin, hidden_record)
      expect(policy).to permit(curriculum_lead, hidden_record)
      expect(policy).to permit(teacher, visible_record)
    end

    it "denies teacher for hidden records" do
      expect(policy).not_to permit(teacher, hidden_record)
    end
  end

  permissions :destroy? do
    it "permits privileged users only" do
      expect(policy).to permit(admin, visible_record)
      expect(policy).to permit(curriculum_lead, visible_record)
      expect(policy).not_to permit(teacher, visible_record)
    end
  end

  describe "Scope" do
    let!(:teacher_visible) { visible_record }
    let!(:teacher_hidden) { hidden_record }

    it "returns all for privileged users" do
      expect(described_class::Scope.new(admin, SyncMapping).resolve).to contain_exactly(teacher_visible, teacher_hidden)
    end

    it "returns only visible mappings for teacher" do
      expect(described_class::Scope.new(teacher, SyncMapping).resolve).to contain_exactly(teacher_visible)
    end

    it "returns none for students" do
      expect(described_class::Scope.new(student, SyncMapping).resolve).to be_empty
    end
  end
end
