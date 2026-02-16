require "rails_helper"

RSpec.describe DiscussionPostPolicy, type: :policy do
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
  let(:student) { u = create(:user, tenant: tenant); u.add_role(:student); u }
  let(:other_student) { u = create(:user, tenant: tenant); u.add_role(:student); u }

  let(:discussion) { create(:discussion, tenant: tenant, course: course, created_by: other_teacher) }
  let(:record) { create(:discussion_post, tenant: tenant, discussion: discussion, created_by: student) }

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

  permissions :create? do
    it "permits enrolled users when discussion is open" do
      expect(policy).to permit(student, record)
      expect(policy).to permit(teacher, record)
    end

    it "denies unenrolled users and privileged users without enrollment" do
      expect(policy).not_to permit(admin, record)
      expect(policy).not_to permit(curriculum_lead, record)
      expect(policy).not_to permit(other_student, record)
    end

    it "denies posting when discussion is locked" do
      locked_discussion = create(:discussion, tenant: tenant, course: course, created_by: other_teacher, status: "locked")
      locked_post = build(:discussion_post, tenant: tenant, discussion: locked_discussion, created_by: student)
      expect(policy).not_to permit(student, locked_post)
    end
  end

  permissions :destroy? do
    it "permits admin, owner, and teacher in course" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(student, record)
      expect(policy).to permit(teacher, record)
    end

    it "denies curriculum lead and unrelated student" do
      expect(policy).not_to permit(curriculum_lead, record)
      expect(policy).not_to permit(other_student, record)
    end
  end

  describe "Scope" do
    let!(:student_post) { create(:discussion_post, tenant: tenant, discussion: discussion, created_by: student) }
    let!(:teacher_post) { create(:discussion_post, tenant: tenant, discussion: discussion, created_by: teacher) }
    let!(:hidden_post) do
      hidden_discussion = create(:discussion, tenant: tenant, course: other_course, created_by: other_teacher)
      create(:discussion_post, tenant: tenant, discussion: hidden_discussion, created_by: other_teacher)
    end

    it "returns all for admin" do
      scope = described_class::Scope.new(admin, DiscussionPost).resolve
      expect(scope).to include(student_post, teacher_post, hidden_post)
    end

    it "returns taught-course posts for teacher" do
      scope = described_class::Scope.new(teacher, DiscussionPost).resolve
      expect(scope).to include(student_post, teacher_post)
      expect(scope).not_to include(hidden_post)
    end

    it "returns enrolled-course posts for student" do
      scope = described_class::Scope.new(student, DiscussionPost).resolve
      expect(scope).to include(student_post, teacher_post)
      expect(scope).not_to include(hidden_post)
    end
  end
end
