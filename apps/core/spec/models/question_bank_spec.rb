require "rails_helper"

RSpec.describe QuestionBank, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:created_by).class_name("User") }
    it { should have_many(:questions).dependent(:destroy) }
  end

  describe "validations" do
    it { should validate_presence_of(:title) }
    it { should validate_inclusion_of(:status).in_array(QuestionBank::VALID_STATUSES) }
  end

  describe "#archive!" do
    it "archives active bank" do
      bank = create(:question_bank, tenant: tenant, status: "active")
      bank.archive!
      expect(bank.reload.status).to eq("archived")
    end

    it "raises when not active" do
      bank = create(:question_bank, tenant: tenant, status: "archived")
      expect { bank.archive! }.to raise_error(ActiveRecord::RecordInvalid)
    end
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      b1 = create(:question_bank, tenant: t1)
      Current.tenant = t2
      create(:question_bank, tenant: t2)

      Current.tenant = t1
      expect(QuestionBank.all).to contain_exactly(b1)
    end
  end
end
