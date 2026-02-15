require "rails_helper"

RSpec.describe QuizAccommodationPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:admin) { u = create(:user, tenant: tenant); u.add_role(:admin); u }
  let(:teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:student) { u = create(:user, tenant: tenant); u.add_role(:student); u }
  let(:record) { create(:quiz_accommodation, tenant: tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :index?, :create?, :update?, :destroy? do
    it "permits admin and teacher" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(teacher, record)
    end

    it "denies student" do
      expect(policy).not_to permit(student, record)
    end
  end

  describe "Scope" do
    let!(:accommodation) { create(:quiz_accommodation, tenant: tenant) }

    it "returns all for admin and teacher" do
      expect(described_class::Scope.new(admin, QuizAccommodation).resolve).to include(accommodation)
      expect(described_class::Scope.new(teacher, QuizAccommodation).resolve).to include(accommodation)
    end

    it "returns none for students" do
      expect(described_class::Scope.new(student, QuizAccommodation).resolve).to be_empty
    end
  end
end
