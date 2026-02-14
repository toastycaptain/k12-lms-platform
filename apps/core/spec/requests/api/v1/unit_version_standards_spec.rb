require "rails_helper"

RSpec.describe "Api::V1::UnitVersionStandards", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:teacher) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:teacher)
    Current.tenant = nil
    u
  end
  let(:other_teacher) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:teacher)
    Current.tenant = nil
    u
  end
  let(:admin) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:admin)
    Current.tenant = nil
    u
  end

  let(:unit_plan) do
    Current.tenant = tenant
    ay = create(:academic_year, tenant: tenant)
    course = create(:course, tenant: tenant, academic_year: ay)
    up = create(:unit_plan, tenant: tenant, course: course, created_by: teacher)
    Current.tenant = nil
    up
  end

  let(:unit_version) do
    Current.tenant = tenant
    v = unit_plan.create_version!(title: "v1")
    Current.tenant = nil
    v
  end

  let(:framework) do
    Current.tenant = tenant
    f = create(:standard_framework, tenant: tenant)
    Current.tenant = nil
    f
  end

  let(:standards) do
    Current.tenant = tenant
    s1 = create(:standard, tenant: tenant, standard_framework: framework, code: "CCSS.1")
    s2 = create(:standard, tenant: tenant, standard_framework: framework, code: "CCSS.2")
    s3 = create(:standard, tenant: tenant, standard_framework: framework, code: "CCSS.3")
    Current.tenant = nil
    [ s1, s2, s3 ]
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/unit_versions/:unit_version_id/standards" do
    it "returns aligned standards" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      standards.first(2).each do |s|
        UnitVersionStandard.create!(tenant: tenant, unit_version: unit_version, standard: s)
      end
      Current.tenant = nil

      get "/api/v1/unit_versions/#{unit_version.id}/standards"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(2)
      codes = response.parsed_body.map { |s| s["code"] }
      expect(codes).to contain_exactly("CCSS.1", "CCSS.2")
    end
  end

  describe "POST /api/v1/unit_versions/:unit_version_id/standards" do
    it "bulk-attaches standards for unit owner" do
      mock_session(teacher, tenant: tenant)
      stds = standards

      expect {
        post "/api/v1/unit_versions/#{unit_version.id}/standards",
             params: { standard_ids: stds.map(&:id) }
      }.to change(UnitVersionStandard.unscoped, :count).by(3)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body.length).to eq(3)
    end

    it "is idempotent — attaching already-attached standard does not error" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      UnitVersionStandard.create!(tenant: tenant, unit_version: unit_version, standard: standards.first)
      Current.tenant = nil

      expect {
        post "/api/v1/unit_versions/#{unit_version.id}/standards",
             params: { standard_ids: [ standards.first.id, standards.second.id ] }
      }.to change(UnitVersionStandard.unscoped, :count).by(1)

      expect(response).to have_http_status(:created)
    end

    it "allows admin to attach standards to any unit" do
      mock_session(admin, tenant: tenant)
      stds = standards

      post "/api/v1/unit_versions/#{unit_version.id}/standards",
           params: { standard_ids: [ stds.first.id ] }

      expect(response).to have_http_status(:created)
    end

    it "denies non-owner non-admin from attaching standards" do
      mock_session(other_teacher, tenant: tenant)
      stds = standards

      post "/api/v1/unit_versions/#{unit_version.id}/standards",
           params: { standard_ids: [ stds.first.id ] }

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "DELETE /api/v1/unit_versions/:unit_version_id/standards" do
    it "bulk-detaches standards for unit owner" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      standards.each do |s|
        UnitVersionStandard.create!(tenant: tenant, unit_version: unit_version, standard: s)
      end
      Current.tenant = nil

      expect {
        delete "/api/v1/unit_versions/#{unit_version.id}/standards/bulk_destroy",
               params: { standard_ids: [ standards.first.id, standards.second.id ] }
      }.to change(UnitVersionStandard.unscoped, :count).by(-2)

      expect(response).to have_http_status(:no_content)
    end

    it "denies non-owner non-admin from detaching standards" do
      mock_session(other_teacher, tenant: tenant)
      Current.tenant = tenant
      UnitVersionStandard.create!(tenant: tenant, unit_version: unit_version, standard: standards.first)
      Current.tenant = nil

      delete "/api/v1/unit_versions/#{unit_version.id}/standards/bulk_destroy",
             params: { standard_ids: [ standards.first.id ] }

      expect(response).to have_http_status(:forbidden)
    end
  end
end
