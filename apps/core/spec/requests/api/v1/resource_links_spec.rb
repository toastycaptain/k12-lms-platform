require "rails_helper"

RSpec.describe "Api::V1::ResourceLinks", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:teacher) do
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

  describe "with UnitVersion linkable" do
    let(:unit_version) do
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: teacher)
      version = unit_plan.create_version!(title: "v1")
      Current.tenant = nil
      version
    end

    describe "GET /api/v1/unit_versions/:unit_version_id/resource_links" do
      it "returns resource links for a unit version" do
        mock_session(teacher, tenant: tenant)
        Current.tenant = tenant
        create(:resource_link, tenant: tenant, linkable: unit_version, title: "Doc 1")
        Current.tenant = nil

        get "/api/v1/unit_versions/#{unit_version.id}/resource_links"

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body.length).to eq(1)
        expect(response.parsed_body.first["title"]).to eq("Doc 1")
      end
    end

    describe "POST /api/v1/unit_versions/:unit_version_id/resource_links" do
      it "creates a resource link" do
        mock_session(teacher, tenant: tenant)
        unit_version # ensure created

        expect {
          post "/api/v1/unit_versions/#{unit_version.id}/resource_links", params: {
            resource_link: { url: "https://docs.google.com/doc/123", title: "My Doc", provider: "url" }
          }
        }.to change(ResourceLink.unscoped, :count).by(1)

        expect(response).to have_http_status(:created)
        expect(response.parsed_body["title"]).to eq("My Doc")
      end
    end

    describe "DELETE /api/v1/unit_versions/:unit_version_id/resource_links/:id" do
      it "deletes a resource link" do
        mock_session(teacher, tenant: tenant)
        Current.tenant = tenant
        link = create(:resource_link, tenant: tenant, linkable: unit_version)
        Current.tenant = nil

        expect {
          delete "/api/v1/unit_versions/#{unit_version.id}/resource_links/#{link.id}"
        }.to change(ResourceLink.unscoped, :count).by(-1)

        expect(response).to have_http_status(:no_content)
      end
    end
  end

  describe "with LessonVersion linkable" do
    let(:lesson_version) do
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: teacher)
      lesson_plan = create(:lesson_plan, tenant: tenant, unit_plan: unit_plan, created_by: teacher)
      version = lesson_plan.create_version!(title: "v1")
      Current.tenant = nil
      version
    end

    describe "POST /api/v1/lesson_versions/:lesson_version_id/resource_links" do
      it "creates a resource link on a lesson version" do
        mock_session(teacher, tenant: tenant)
        lesson_version # ensure created

        expect {
          post "/api/v1/lesson_versions/#{lesson_version.id}/resource_links", params: {
            resource_link: { url: "https://drive.google.com/file/abc", title: "Worksheet", provider: "google_drive", drive_file_id: "abc" }
          }
        }.to change(ResourceLink.unscoped, :count).by(1)

        expect(response).to have_http_status(:created)
        expect(response.parsed_body["provider"]).to eq("google_drive")
      end
    end
  end
end
