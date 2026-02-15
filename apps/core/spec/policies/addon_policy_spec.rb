require "rails_helper"

RSpec.describe AddonPolicy, type: :policy do
  let(:tenant) { create(:tenant) }
  let(:admin) { u = create(:user, tenant: tenant); u.add_role(:admin); u }
  let(:teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:student) { u = create(:user, tenant: tenant); u.add_role(:student); u }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  it "permits all addon actions for admin and teacher" do
    policy_for_admin = described_class.new(admin, :addon)
    policy_for_teacher = described_class.new(teacher, :addon)

    %i[unit_plans? lessons? attach? me? standards? templates? ai_generate?].each do |action|
      expect(policy_for_admin.public_send(action)).to eq(true)
      expect(policy_for_teacher.public_send(action)).to eq(true)
    end
  end

  it "denies addon actions for student" do
    policy_for_student = described_class.new(student, :addon)

    %i[unit_plans? lessons? attach? me? standards? templates? ai_generate?].each do |action|
      expect(policy_for_student.public_send(action)).to eq(false)
    end
  end

  describe "Scope" do
    let!(:unit_plan) { create(:unit_plan, tenant: tenant, created_by: teacher) }

    it "returns all records" do
      scope = described_class::Scope.new(student, UnitPlan).resolve
      expect(scope).to include(unit_plan)
    end
  end
end
