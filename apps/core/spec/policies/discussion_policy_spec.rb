require "rails_helper"

RSpec.describe DiscussionPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:other_course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:section) { create(:section, tenant: tenant, course: course, term: term) }

  let(:admin) { u = create(:user, tenant: tenant); u.add_role(:admin); u }
  let(:curriculum_lead) { u = create(:user, tenant: tenant); u.add_role(:curriculum_lead); u }
  let(:teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:other_teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:unrelated_teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:student) { u = create(:user, tenant: tenant); u.add_role(:student); u }

  let(:record) { create(:discussion, tenant: tenant, course: course, created_by: other_teacher) }

  before do
    Current.tenant = tenant
    create(:enrollment, tenant: tenant, user: teacher, section: section, role: "teacher")
    create(:enrollment, tenant: tenant, user: student, section: section, role: "student")
  end

  after { Current.tenant = nil }

  permissions :index? do
    it "permits all users" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(teacher, record)
      expect(policy).to permit(student, record)
    end
  end

  permissions :show? do
    it "permits admin and enrolled users" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(teacher, record)
      expect(policy).to permit(student, record)
    end

    it "denies curriculum lead" do
      expect(policy).not_to permit(curriculum_lead, record)
    end
  end

  permissions :create?, :update?, :destroy?, :lock?, :unlock? do
    it "permits admin and teaching teacher" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(teacher, record)
    end

    it "denies curriculum lead and unrelated teacher" do
      expect(policy).not_to permit(curriculum_lead, record)
      expect(policy).not_to permit(unrelated_teacher, create(:discussion, tenant: tenant, course: other_course, created_by: other_teacher))
    end
  end

  describe "Scope" do
    let!(:teacher_owned_discussion) { create(:discussion, tenant: tenant, course: other_course, created_by: teacher) }
    let!(:taught_course_discussion) { create(:discussion, tenant: tenant, course: course, created_by: other_teacher) }
    let!(:hidden_discussion) { create(:discussion, tenant: tenant, course: other_course, created_by: other_teacher) }

    it "returns all for admin" do
      scope = described_class::Scope.new(admin, Discussion).resolve
      expect(scope).to include(teacher_owned_discussion, taught_course_discussion, hidden_discussion)
    end

    it "returns taught-course discussions for teacher" do
      scope = described_class::Scope.new(teacher, Discussion).resolve
      expect(scope).to include(taught_course_discussion)
      expect(scope).not_to include(teacher_owned_discussion)
      expect(scope).not_to include(hidden_discussion)
    end

    it "returns enrolled-course only for student" do
      scope = described_class::Scope.new(student, Discussion).resolve
      expect(scope).to include(taught_course_discussion)
      expect(scope).not_to include(teacher_owned_discussion)
      expect(scope).not_to include(hidden_discussion)
    end
  end
end
