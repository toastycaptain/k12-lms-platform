require "rails_helper"

RSpec.describe AiTemplate, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:created_by).class_name("User") }
    it { should have_many(:ai_invocations).dependent(:nullify) }
  end

  describe "validations" do
    it { should validate_presence_of(:name) }
    it { should validate_presence_of(:system_prompt) }
    it { should validate_presence_of(:user_prompt_template) }
    it { should validate_inclusion_of(:status).in_array(AiTemplate::VALID_STATUSES) }
    it { should validate_inclusion_of(:task_type).in_array(AiTemplate::VALID_TASK_TYPES) }
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      t1_template = create(:ai_template, tenant: t1)
      Current.tenant = t2
      create(:ai_template, tenant: t2)

      Current.tenant = t1
      expect(AiTemplate.all).to contain_exactly(t1_template)
    end
  end
end
