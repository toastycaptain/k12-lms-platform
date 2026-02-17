require "rails_helper"

RSpec.describe DrivePolicy, type: :policy do
  let(:tenant) { create(:tenant) }
  let(:admin) { u = create(:user, tenant: tenant); u.add_role(:admin); u }
  let(:teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:curriculum_lead) { u = create(:user, tenant: tenant); u.add_role(:curriculum_lead); u }
  let(:student) { u = create(:user, tenant: tenant); u.add_role(:student); u }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  it "permits create and show actions for all users" do
    policy_for_student = described_class.new(student, :drive)

    expect(policy_for_student.create_document?).to eq(true)
    expect(policy_for_student.create_presentation?).to eq(true)
    expect(policy_for_student.show_file?).to eq(true)
  end

  it "permits picker_token only for teacher/admin/curriculum_lead" do
    expect(described_class.new(admin, :drive).picker_token?).to eq(true)
    expect(described_class.new(teacher, :drive).picker_token?).to eq(true)
    expect(described_class.new(curriculum_lead, :drive).picker_token?).to eq(true)
    expect(described_class.new(student, :drive).picker_token?).to eq(false)
  end

  it "permits advanced drive actions only for teacher/admin/curriculum_lead" do
    expect(described_class.new(admin, :drive).share?).to eq(true)
    expect(described_class.new(admin, :drive).folder?).to eq(true)
    expect(described_class.new(admin, :drive).copy?).to eq(true)
    expect(described_class.new(admin, :drive).preview?).to eq(true)

    expect(described_class.new(student, :drive).share?).to eq(false)
    expect(described_class.new(student, :drive).folder?).to eq(false)
    expect(described_class.new(student, :drive).copy?).to eq(false)
    expect(described_class.new(student, :drive).preview?).to eq(false)
  end
end
