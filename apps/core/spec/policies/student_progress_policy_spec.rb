require "rails_helper"

RSpec.describe StudentProgressPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:section) { create(:section, tenant: tenant, course: course, term: term) }

  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:admin)
    user
  end

  let(:teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:teacher)
    user
  end

  let(:other_teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:teacher)
    user
  end

  let(:guardian) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:guardian)
    user
  end

  let(:other_guardian) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:guardian)
    user
  end

  let(:student) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:student)
    user
  end

  let(:other_student) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:student)
    user
  end

  before do
    Current.tenant = tenant
    create(:enrollment, tenant: tenant, user: teacher, section: section, role: "teacher")
    create(:enrollment, tenant: tenant, user: student, section: section, role: "student")
    create(:guardian_link, tenant: tenant, guardian: guardian, student: student, status: "active")
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  permissions :show?, :course_detail? do
    it "permits admin users" do
      expect(policy).to permit(admin, student)
    end

    it "permits the student viewing their own progress" do
      expect(policy).to permit(student, student)
    end

    it "denies another student" do
      expect(policy).not_to permit(other_student, student)
    end

    it "permits teachers with shared course enrollment" do
      expect(policy).to permit(teacher, student)
    end

    it "denies unrelated teachers" do
      expect(policy).not_to permit(other_teacher, student)
    end

    it "permits linked guardians" do
      expect(policy).to permit(guardian, student)
    end

    it "denies unlinked guardians" do
      expect(policy).not_to permit(other_guardian, student)
    end
  end

  describe "Scope" do
    it "returns the linked student for guardians" do
      scope = described_class::Scope.new(guardian, User).resolve
      expect(scope).to contain_exactly(student)
    end

    it "returns shared students for teachers" do
      scope = described_class::Scope.new(teacher, User).resolve
      expect(scope).to contain_exactly(student)
    end

    it "returns self for student users" do
      scope = described_class::Scope.new(student, User).resolve
      expect(scope).to contain_exactly(student)
    end
  end
end
