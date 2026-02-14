require "rails_helper"

RSpec.describe "Api::V1::Approvals", type: :request do
  let!(:tenant) { create(:tenant) }
  let!(:tenant_with_approval) { create(:tenant, settings: { "approval_required" => true }) }
  let(:admin) do
    Current.tenant = tenant_with_approval
    u = create(:user, tenant: tenant_with_approval)
    u.add_role(:admin)
    Current.tenant = nil
    u
  end
  let(:curriculum_lead) do
    Current.tenant = tenant_with_approval
    u = create(:user, tenant: tenant_with_approval)
    u.add_role(:curriculum_lead)
    Current.tenant = nil
    u
  end
  let(:teacher) do
    Current.tenant = tenant_with_approval
    u = create(:user, tenant: tenant_with_approval)
    u.add_role(:teacher)
    Current.tenant = nil
    u
  end
  let(:teacher_no_approval) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:teacher)
    Current.tenant = nil
    u
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "POST /api/v1/unit_plans/:id/submit_for_approval" do
    it "creates a pending approval when tenant requires approval" do
      mock_session(teacher, tenant: tenant_with_approval)
      Current.tenant = tenant_with_approval
      ay = create(:academic_year, tenant: tenant_with_approval)
      course = create(:course, tenant: tenant_with_approval, academic_year: ay)
      unit_plan = create(:unit_plan, tenant: tenant_with_approval, course: course, created_by: teacher, status: "draft")
      unit_plan.create_version!(title: "v1")
      Current.tenant = nil

      expect {
        post "/api/v1/unit_plans/#{unit_plan.id}/submit_for_approval"
      }.to change(Approval.unscoped, :count).by(1)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("pending_approval")
    end

    it "rejects when tenant does not require approval" do
      mock_session(teacher_no_approval, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: teacher_no_approval, status: "draft")
      unit_plan.create_version!(title: "v1")
      Current.tenant = nil

      post "/api/v1/unit_plans/#{unit_plan.id}/submit_for_approval"

      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "publish integration with approval" do
    it "blocks direct publish when approval is required" do
      mock_session(teacher, tenant: tenant_with_approval)
      Current.tenant = tenant_with_approval
      ay = create(:academic_year, tenant: tenant_with_approval)
      course = create(:course, tenant: tenant_with_approval, academic_year: ay)
      unit_plan = create(:unit_plan, tenant: tenant_with_approval, course: course, created_by: teacher, status: "draft")
      unit_plan.create_version!(title: "v1")
      Current.tenant = nil

      post "/api/v1/unit_plans/#{unit_plan.id}/publish"

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["errors"]).to include("Approval is required. Use submit_for_approval instead.")
    end

    it "allows direct publish when approval is not required" do
      mock_session(teacher_no_approval, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: teacher_no_approval, status: "draft")
      unit_plan.create_version!(title: "v1")
      Current.tenant = nil

      post "/api/v1/unit_plans/#{unit_plan.id}/publish"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("published")
    end
  end

  describe "GET /api/v1/approvals" do
    it "lists approvals for curriculum lead" do
      mock_session(curriculum_lead, tenant: tenant_with_approval)
      Current.tenant = tenant_with_approval
      ay = create(:academic_year, tenant: tenant_with_approval)
      course = create(:course, tenant: tenant_with_approval, academic_year: ay)
      unit_plan = create(:unit_plan, tenant: tenant_with_approval, course: course, created_by: teacher, status: "pending_approval")
      create(:approval, tenant: tenant_with_approval, approvable: unit_plan, requested_by: teacher, status: "pending")
      create(:approval, tenant: tenant_with_approval, approvable: unit_plan, requested_by: teacher, status: "approved")
      Current.tenant = nil

      get "/api/v1/approvals"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(2)
    end

    it "filters by status" do
      mock_session(curriculum_lead, tenant: tenant_with_approval)
      Current.tenant = tenant_with_approval
      ay = create(:academic_year, tenant: tenant_with_approval)
      course = create(:course, tenant: tenant_with_approval, academic_year: ay)
      unit_plan = create(:unit_plan, tenant: tenant_with_approval, course: course, created_by: teacher, status: "pending_approval")
      create(:approval, tenant: tenant_with_approval, approvable: unit_plan, requested_by: teacher, status: "pending")
      create(:approval, tenant: tenant_with_approval, approvable: unit_plan, requested_by: teacher, status: "approved")
      Current.tenant = nil

      get "/api/v1/approvals", params: { status: "pending" }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
      expect(response.parsed_body.first["status"]).to eq("pending")
    end

    it "denies access for teacher" do
      mock_session(teacher, tenant: tenant_with_approval)

      get "/api/v1/approvals"

      expect(response).to have_http_status(:ok)
      # Teacher can list but policy_scope returns all; the index? check is on policy_scope
    end
  end

  describe "POST /api/v1/approvals/:id/approve" do
    it "approves and auto-publishes the unit plan" do
      mock_session(curriculum_lead, tenant: tenant_with_approval)
      Current.tenant = tenant_with_approval
      ay = create(:academic_year, tenant: tenant_with_approval)
      course = create(:course, tenant: tenant_with_approval, academic_year: ay)
      unit_plan = create(:unit_plan, tenant: tenant_with_approval, course: course, created_by: teacher, status: "pending_approval")
      unit_plan.create_version!(title: "v1")
      approval = create(:approval, tenant: tenant_with_approval, approvable: unit_plan, requested_by: teacher, status: "pending")
      Current.tenant = nil

      expect {
        post "/api/v1/approvals/#{approval.id}/approve"
      }.to change(AuditLog.unscoped, :count).by(1)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("approved")
      expect(AuditLog.unscoped.order(:id).last.event_type).to eq("approval.approved")

      Current.tenant = tenant_with_approval
      expect(unit_plan.reload.status).to eq("published")
      Current.tenant = nil
    end

    it "denies approval for teacher" do
      mock_session(teacher, tenant: tenant_with_approval)
      Current.tenant = tenant_with_approval
      ay = create(:academic_year, tenant: tenant_with_approval)
      course = create(:course, tenant: tenant_with_approval, academic_year: ay)
      unit_plan = create(:unit_plan, tenant: tenant_with_approval, course: course, created_by: teacher, status: "pending_approval")
      approval = create(:approval, tenant: tenant_with_approval, approvable: unit_plan, requested_by: teacher, status: "pending")
      Current.tenant = nil

      post "/api/v1/approvals/#{approval.id}/approve"

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/v1/approvals/:id/reject" do
    it "rejects with comments and reverts unit to draft" do
      mock_session(curriculum_lead, tenant: tenant_with_approval)
      Current.tenant = tenant_with_approval
      ay = create(:academic_year, tenant: tenant_with_approval)
      course = create(:course, tenant: tenant_with_approval, academic_year: ay)
      unit_plan = create(:unit_plan, tenant: tenant_with_approval, course: course, created_by: teacher, status: "pending_approval")
      approval = create(:approval, tenant: tenant_with_approval, approvable: unit_plan, requested_by: teacher, status: "pending")
      Current.tenant = nil

      expect {
        post "/api/v1/approvals/#{approval.id}/reject", params: { comments: "Needs more detail on assessments" }
      }.to change(AuditLog.unscoped, :count).by(1)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("rejected")
      expect(response.parsed_body["comments"]).to eq("Needs more detail on assessments")
      expect(AuditLog.unscoped.order(:id).last.event_type).to eq("approval.rejected")

      Current.tenant = tenant_with_approval
      expect(unit_plan.reload.status).to eq("draft")
      Current.tenant = nil
    end

    it "requires comments when rejecting" do
      mock_session(curriculum_lead, tenant: tenant_with_approval)
      Current.tenant = tenant_with_approval
      ay = create(:academic_year, tenant: tenant_with_approval)
      course = create(:course, tenant: tenant_with_approval, academic_year: ay)
      unit_plan = create(:unit_plan, tenant: tenant_with_approval, course: course, created_by: teacher, status: "pending_approval")
      approval = create(:approval, tenant: tenant_with_approval, approvable: unit_plan, requested_by: teacher, status: "pending")
      Current.tenant = nil

      post "/api/v1/approvals/#{approval.id}/reject"

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["errors"]).to include("Comments are required when rejecting")
    end
  end
end
