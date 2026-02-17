require "rails_helper"

RSpec.describe QuestionVersion, type: :model do
  let(:tenant) { create(:tenant) }
  let(:teacher) { create(:user, tenant: tenant) }
  let(:question_bank) { create(:question_bank, tenant: tenant, created_by: teacher) }
  let(:question) { create(:question, tenant: tenant, question_bank: question_bank, created_by: teacher) }

  subject(:question_version) { build(:question_version, tenant: tenant, question: question, created_by: teacher) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:question) }
    it { should belong_to(:created_by).class_name("User").optional }
  end

  describe "validations" do
    it { should validate_presence_of(:question_type) }
    it { should validate_presence_of(:content) }
    it { should validate_inclusion_of(:status).in_array(QuestionVersion::VALID_STATUSES) }
    it { should validate_numericality_of(:version_number).only_integer.is_greater_than(0) }
    it { should validate_numericality_of(:points).is_greater_than(0) }
    it { should validate_uniqueness_of(:version_number).scoped_to(:question_id) }
  end

  describe "tenant consistency" do
    it "requires question to be in same tenant" do
      other_tenant = create(:tenant)
      other_user = create(:user, tenant: other_tenant)
      other_bank = create(:question_bank, tenant: other_tenant, created_by: other_user)
      other_question = create(:question, tenant: other_tenant, question_bank: other_bank, created_by: other_user)

      version = build(:question_version, tenant: tenant, question: other_question, created_by: teacher)

      expect(version).not_to be_valid
      expect(version.errors[:question_id]).to include("must belong to the same tenant")
    end
  end

  describe "question versioning" do
    it "increments version number and updates current_version" do
      first = question.create_version!(created_by: teacher)
      second = question.create_version!(created_by: teacher)

      expect(first.version_number).to eq(1)
      expect(second.version_number).to eq(2)
      expect(question.reload.current_version_id).to eq(second.id)
    end
  end
end
