require "rails_helper"

RSpec.describe GradeCategory, type: :model do
  let(:tenant) { create(:tenant) }
  let(:course) { create(:course, tenant: tenant) }

  subject(:grade_category) { build(:grade_category, tenant: tenant, course: course) }

  it { should belong_to(:course) }
  it { should have_many(:assignments).dependent(:nullify) }

  it { should validate_presence_of(:name) }
  it do
    should validate_numericality_of(:weight_percentage)
      .is_greater_than_or_equal_to(0)
      .is_less_than_or_equal_to(100)
  end

  it "enforces unique names per course and tenant" do
    create(:grade_category, tenant: tenant, course: course, name: "Homework")

    duplicate = build(:grade_category, tenant: tenant, course: course, name: "Homework")
    different_course = build(:grade_category, tenant: tenant, course: create(:course, tenant: tenant), name: "Homework")

    expect(duplicate).not_to be_valid
    expect(duplicate.errors[:name]).to include("has already been taken")
    expect(different_course).to be_valid
  end
end
