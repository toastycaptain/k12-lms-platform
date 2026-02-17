require "rails_helper"

RSpec.describe "Api::V1::Drive", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:user) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant, google_refresh_token: "test-refresh-token",
      google_access_token: "test-access-token",
      google_token_expires_at: 1.hour.from_now)
    u.add_role(:teacher)
    Current.tenant = nil
    u
  end
  let(:disconnected_user) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant, google_refresh_token: nil)
    u.add_role(:teacher)
    Current.tenant = nil
    u
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  let(:drive_service) { instance_double(GoogleDriveService) }
  let(:token_service) { instance_double(GoogleTokenService) }

  before do
    allow(GoogleDriveService).to receive(:new).and_return(drive_service)
    allow(GoogleTokenService).to receive(:new).and_return(token_service)
  end

  describe "POST /api/v1/drive/documents" do
    it "creates a document" do
      mock_session(user, tenant: tenant)
      allow(drive_service).to receive(:create_document).and_return({
        id: "doc_123", title: "My Doc", url: "https://docs.google.com/doc/123", mime_type: "application/vnd.google-apps.document"
      })

      post "/api/v1/drive/documents", params: { title: "My Doc" }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["id"]).to eq("doc_123")
    end

    it "returns 422 when Google not connected" do
      mock_session(disconnected_user, tenant: tenant)

      post "/api/v1/drive/documents", params: { title: "My Doc" }

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body["error"]).to eq("Google account not connected")
    end

    it "creates a resource link when linkable params provided" do
      mock_session(user, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      assignment = create(:assignment, tenant: tenant, course: course, created_by: user)
      Current.tenant = nil

      allow(drive_service).to receive(:create_document).and_return({
        id: "doc_456", title: "Linked Doc", url: "https://docs.google.com/doc/456", mime_type: "application/vnd.google-apps.document"
      })

      expect {
        post "/api/v1/drive/documents", params: {
          title: "Linked Doc",
          linkable_type: "Assignment",
          linkable_id: assignment.id
        }
      }.to change(ResourceLink.unscoped, :count).by(1)

      expect(response).to have_http_status(:created)
    end
  end

  describe "POST /api/v1/drive/presentations" do
    it "creates a presentation" do
      mock_session(user, tenant: tenant)
      allow(drive_service).to receive(:create_presentation).and_return({
        id: "pres_123", title: "My Presentation", url: "https://docs.google.com/pres/123", mime_type: "application/vnd.google-apps.presentation"
      })

      post "/api/v1/drive/presentations", params: { title: "My Presentation" }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["id"]).to eq("pres_123")
    end
  end

  describe "GET /api/v1/drive/files/:file_id" do
    it "returns file info" do
      mock_session(user, tenant: tenant)
      allow(drive_service).to receive(:get_file).with("file_abc").and_return({
        id: "file_abc", name: "My File", mime_type: "application/pdf", url: "https://drive.google.com/file_abc"
      })

      get "/api/v1/drive/files/file_abc"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["id"]).to eq("file_abc")
    end
  end

  describe "POST /api/v1/drive/picker_token" do
    it "returns an access token" do
      mock_session(user, tenant: tenant)
      allow(token_service).to receive(:access_token).and_return("fresh-token")

      post "/api/v1/drive/picker_token"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["access_token"]).to eq("fresh-token")
    end
  end

  describe "POST /api/v1/drive/share" do
    it "shares a file with a single user" do
      mock_session(user, tenant: tenant)
      allow(drive_service).to receive(:share_file).and_return({
        id: "perm_1",
        email: "student@example.com",
        role: "reader",
        type: "user"
      })

      post "/api/v1/drive/share", params: {
        file_id: "file_1",
        email: "student@example.com"
      }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["id"]).to eq("perm_1")
    end

    it "shares a file in batch mode" do
      mock_session(user, tenant: tenant)
      allow(drive_service).to receive(:share_file_batch).and_return({
        shared: [ { id: "perm_1", email: "student@example.com", role: "reader", type: "user" } ],
        failed: []
      })

      post "/api/v1/drive/share", params: {
        file_id: "file_1",
        emails: [ "student@example.com" ]
      }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["shared"].length).to eq(1)
    end

    it "returns 422 for missing recipient" do
      mock_session(user, tenant: tenant)

      post "/api/v1/drive/share", params: { file_id: "file_1" }

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body["error"]).to eq("email or emails is required")
    end
  end

  describe "POST /api/v1/drive/folder" do
    it "creates a folder and attaches it to a course when course_id is provided" do
      mock_session(user, tenant: tenant)
      Current.tenant = tenant
      academic_year = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: academic_year)
      Current.tenant = nil
      allow(drive_service).to receive(:create_folder).and_return({
        id: "folder_1",
        name: "Course Folder",
        mime_type: "application/vnd.google-apps.folder",
        url: "https://drive.google.com/drive/folders/folder_1"
      })

      post "/api/v1/drive/folder", params: {
        name: "Course Folder",
        course_id: course.id
      }

      expect(response).to have_http_status(:created)
      expect(course.reload.settings["drive_folder_id"]).to eq("folder_1")
    end
  end

  describe "GET /api/v1/drive/folder" do
    it "lists files from Drive" do
      mock_session(user, tenant: tenant)
      allow(drive_service).to receive(:list_files).and_return([
        { id: "file_1", name: "Worksheet", mime_type: "application/pdf", url: "https://drive.google.com/file_1" }
      ])

      get "/api/v1/drive/folder", params: { folder_id: "folder_1" }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.first["id"]).to eq("file_1")
    end
  end

  describe "POST /api/v1/drive/copy" do
    it "copies a drive file" do
      mock_session(user, tenant: tenant)
      allow(drive_service).to receive(:copy_file).and_return({
        id: "copy_1",
        name: "Copy",
        mime_type: "application/vnd.google-apps.document",
        url: "https://docs.google.com/document/d/copy_1"
      })

      post "/api/v1/drive/copy", params: {
        file_id: "template_1",
        new_name: "Copy"
      }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["id"]).to eq("copy_1")
    end
  end

  describe "GET /api/v1/drive/preview/:file_id" do
    it "returns a preview URL for a file" do
      mock_session(user, tenant: tenant)
      allow(drive_service).to receive(:preview_url)
        .with("file_1")
        .and_return("https://drive.google.com/file/d/file_1/preview")

      get "/api/v1/drive/preview/file_1"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["preview_url"]).to eq("https://drive.google.com/file/d/file_1/preview")
    end
  end
end
