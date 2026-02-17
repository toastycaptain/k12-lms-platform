require "rails_helper"

RSpec.describe DistrictPolicy, type: :policy do
  let(:district_admin) { build_stubbed(:user, district_admin: true) }
  let(:teacher) { build_stubbed(:user, district_admin: false) }

  it "allows district admins to access district endpoints" do
    policy = described_class.new(district_admin, :district)

    expect(policy.schools?).to eq(true)
    expect(policy.standards_coverage?).to eq(true)
    expect(policy.user_summary?).to eq(true)
    expect(policy.push_template?).to eq(true)
  end

  it "denies district endpoints for non-district admins" do
    policy = described_class.new(teacher, :district)

    expect(policy.schools?).to eq(false)
    expect(policy.standards_coverage?).to eq(false)
    expect(policy.user_summary?).to eq(false)
    expect(policy.push_template?).to eq(false)
  end
end
