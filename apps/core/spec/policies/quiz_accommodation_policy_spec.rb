require "rails_helper"

RSpec.describe QuizAccommodationPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:admin) { u = create(:user, tenant: tenant); u.add_role(:admin); u }
  let(:teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:student) { u = create(:user, tenant: tenant); u.add_role(:student); u }
  let(:other_student) { u = create(:user, tenant: tenant); u.add_role(:student); u }
  let(:record) { create(:quiz_accommodation, tenant: tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :index? do
    it "permits admin, teacher, and student" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(teacher, record)
      expect(policy).to permit(student, record)
    end
  end

  permissions :create?, :update?, :destroy? do
    it "permits admin and teacher only" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(teacher, record)
      expect(policy).not_to permit(student, record)
    end
  end

  describe "Scope" do
    let!(:student_accommodation) { create(:quiz_accommodation, tenant: tenant, user: student) }
    let!(:other_accommodation) { create(:quiz_accommodation, tenant: tenant, user: other_student) }

    it "returns all for admin and teacher" do
      expect(described_class::Scope.new(admin, QuizAccommodation).resolve).to include(student_accommodation, other_accommodation)
      expect(described_class::Scope.new(teacher, QuizAccommodation).resolve).to include(student_accommodation, other_accommodation)
    end

    it "returns only the current student's accommodations for students" do
      resolved = described_class::Scope.new(student, QuizAccommodation).resolve
      expect(resolved).to contain_exactly(student_accommodation)
    end
  end
end
