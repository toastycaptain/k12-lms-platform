require "rails_helper"

RSpec.describe AiTemplate, type: :model do
  describe "associations" do
    it { should belong_to(:tenant) }
    it { should belong_to(:created_by).class_name("User") }
  end

  describe "validations" do
    it { should validate_presence_of(:task_type) }
    it { should validate_inclusion_of(:task_type).in_array(AiTaskPolicy::VALID_TASK_TYPES) }
    it { should validate_presence_of(:name) }
    it { should validate_presence_of(:system_prompt) }
    it { should validate_presence_of(:user_prompt_template) }
    it { should validate_presence_of(:status) }
    it { should validate_inclusion_of(:status).in_array(AiTemplate::VALID_STATUSES) }
    it { should validate_presence_of(:tenant_id) }
  end

  describe "scopes" do
    let(:tenant) { create(:tenant) }
    let(:user) { create(:user, tenant: tenant) }

    before { Current.tenant = tenant }
    after { Current.tenant = nil }

    it ".active returns only active templates" do
      create(:ai_template, tenant: tenant, created_by: user, status: "draft")
      active = create(:ai_template, tenant: tenant, created_by: user, status: "active",
        name: "Active", task_type: "unit_generation")
      expect(AiTemplate.active).to contain_exactly(active)
    end

    it ".for_task_type filters by type" do
      t1 = create(:ai_template, tenant: tenant, created_by: user, task_type: "lesson_generation")
      create(:ai_template, tenant: tenant, created_by: user, task_type: "unit_generation",
        name: "Unit Gen")
      expect(AiTemplate.for_task_type("lesson_generation")).to contain_exactly(t1)
    end
  end

  describe "#render" do
    let(:tenant) { create(:tenant) }

    before { Current.tenant = tenant }
    after { Current.tenant = nil }

    it "replaces variables in template" do
      user = create(:user, tenant: tenant)
      template = create(:ai_template, tenant: tenant, created_by: user)

      result = template.render(subject: "Math", topic: "Fractions", grade_level: "5th")
      expect(result).to eq("Generate a lesson plan for Math covering Fractions for grade 5th.")
    end

    it "raises for missing required variables" do
      user = create(:user, tenant: tenant)
      template = create(:ai_template, tenant: tenant, created_by: user)

      expect { template.render(subject: "Math") }.to raise_error(ArgumentError, /Missing required variable/)
    end
  end

  describe "#activate!" do
    let(:tenant) { create(:tenant) }

    before { Current.tenant = tenant }
    after { Current.tenant = nil }

    it "sets status to active" do
      user = create(:user, tenant: tenant)
      template = create(:ai_template, tenant: tenant, created_by: user, status: "draft")
      template.activate!
      expect(template.reload.status).to eq("active")
    end
  end

  describe "#archive!" do
    let(:tenant) { create(:tenant) }

    before { Current.tenant = tenant }
    after { Current.tenant = nil }

    it "sets status to archived" do
      user = create(:user, tenant: tenant)
      template = create(:ai_template, tenant: tenant, created_by: user, status: "active")
      template.archive!
      expect(template.reload.status).to eq("archived")
    end
  end
end
