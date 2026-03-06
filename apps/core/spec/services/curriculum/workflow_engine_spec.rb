require "rails_helper"

RSpec.describe Curriculum::WorkflowEngine do
  let(:tenant) do
    create(:tenant, settings: { "curriculum_default_profile_key" => "american_common_core_v1" })
  end
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:school) { create(:school, tenant: tenant) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year, school: school) }
  let(:teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:teacher)
    Current.tenant = nil
    user
  end

  before do
    Current.tenant = tenant
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe Curriculum::WorkflowRegistry do
    it "resolves workflow definitions from bindings" do
      pack = CurriculumProfileRegistry.find("american_common_core_v1", "2026.1")
      result = Curriculum::WorkflowRegistry.workflow_for!(pack: pack, document_type: "unit_plan")

      expect(result[:key]).to eq("unit_default")
      expect(result[:definition]).to be_a(Hash)
    end

    it "raises for missing workflow bindings" do
      pack = CurriculumProfileRegistry.find("american_common_core_v1", "2026.1").deep_dup
      pack["workflow_bindings"].delete("unit_plan")

      expect {
        Curriculum::WorkflowRegistry.workflow_for!(pack: pack, document_type: "unit_plan")
      }.to raise_error(Curriculum::WorkflowRegistry::WorkflowError)
    end
  end

  describe ".transition!" do
    let(:unit_plan) do
      create(:unit_plan, tenant: tenant, course: course, created_by: teacher, status: "draft")
    end

    it "enforces role gates" do
      viewer = create(:user, tenant: tenant)
      expect {
        described_class.transition!(record: unit_plan, event: :publish, actor: viewer, context: { approval_required: false })
      }.to raise_error(Curriculum::WorkflowEngine::TransitionError, /Role not permitted/)
    end

    it "stops transition when guard fails" do
      expect {
        described_class.transition!(record: unit_plan, event: :publish, actor: teacher, context: { approval_required: true })
      }.to raise_error(Curriculum::WorkflowEngine::TransitionError, /Guard failed/)
    end

    it "executes side effects for submit_for_approval" do
      expect {
        described_class.transition!(record: unit_plan, event: :submit_for_approval, actor: teacher)
      }.to change { Approval.where(approvable: unit_plan, status: "pending").count }.by(1)

      expect(unit_plan.reload.status).to eq("pending_approval")
    end
  end
end
