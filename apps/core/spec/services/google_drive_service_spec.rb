require "rails_helper"

RSpec.describe GoogleDriveService do
  let!(:tenant) { create(:tenant) }
  let(:user) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant,
      google_access_token: "valid-token",
      google_refresh_token: "refresh-token",
      google_token_expires_at: 1.hour.from_now)
    Current.tenant = nil
    u
  end

  let(:mock_drive_service) { instance_double(Google::Apis::DriveV3::DriveService) }
  let(:mock_authorization) { instance_double(Google::Auth::UserRefreshCredentials) }
  let(:token_service) { instance_double(GoogleTokenService, google_credentials: mock_authorization) }
  let(:service) { described_class.new(user) }

  before do
    allow(Google::Apis::DriveV3::DriveService).to receive(:new).and_return(mock_drive_service)
    allow(mock_drive_service).to receive(:authorization=)
    allow(GoogleTokenService).to receive(:new).and_return(token_service)
    allow(GoogleTokenService).to receive(:refresh_if_needed!)
    allow(GoogleTokenService).to receive(:refresh!)
  end

  after { Current.tenant = nil }

  describe "#create_document" do
    it "creates a Google Doc and returns metadata" do
      file = Google::Apis::DriveV3::File.new(
        id: "doc-123",
        name: "My Document",
        mime_type: "application/vnd.google-apps.document",
        web_view_link: "https://docs.google.com/document/d/doc-123",
        icon_link: "https://drive.google.com/icon",
        thumbnail_link: "https://drive.google.com/thumb",
        modified_time: Time.current.iso8601,
        size: 128
      )
      allow(mock_drive_service).to receive(:create_file).and_return(file)

      result = service.create_document("My Document")

      expect(result[:id]).to eq("doc-123")
      expect(result[:title]).to eq("My Document")
      expect(result[:url]).to eq("https://docs.google.com/document/d/doc-123")
      expect(result[:mime_type]).to eq("application/vnd.google-apps.document")
      expect(result[:file_icon]).to eq("doc")
      expect(result[:preview_url]).to eq("https://drive.google.com/file/d/doc-123/preview")
      expect(GoogleTokenService).to have_received(:refresh_if_needed!).with(user)
    end
  end

  describe "#create_presentation" do
    it "creates a Google Slides presentation" do
      file = Google::Apis::DriveV3::File.new(
        id: "pres-123",
        name: "My Presentation",
        mime_type: "application/vnd.google-apps.presentation",
        web_view_link: "https://docs.google.com/presentation/d/pres-123"
      )
      allow(mock_drive_service).to receive(:create_file).and_return(file)

      result = service.create_presentation("My Presentation")

      expect(result[:id]).to eq("pres-123")
      expect(result[:mime_type]).to eq("application/vnd.google-apps.presentation")
    end
  end

  describe "#get_file" do
    it "returns file metadata" do
      file = Google::Apis::DriveV3::File.new(
        id: "file-123",
        name: "Some File",
        mime_type: "application/pdf",
        web_view_link: "https://drive.google.com/file/d/file-123"
      )
      allow(mock_drive_service).to receive(:get_file).and_return(file)

      result = service.get_file("file-123")

      expect(result[:id]).to eq("file-123")
      expect(result[:name]).to eq("Some File")
      expect(result[:url]).to eq("https://drive.google.com/file/d/file-123")
    end

    it "refreshes and retries once on authorization errors" do
      file = Google::Apis::DriveV3::File.new(
        id: "file-123",
        name: "Retry File",
        mime_type: "application/pdf",
        web_view_link: "https://drive.google.com/file/d/file-123"
      )
      call_count = 0
      allow(mock_drive_service).to receive(:get_file) do
        call_count += 1
        raise Google::Apis::AuthorizationError.new("Expired token") if call_count == 1

        file
      end

      result = service.get_file("file-123")

      expect(result[:id]).to eq("file-123")
      expect(mock_drive_service).to have_received(:get_file).twice
      expect(GoogleTokenService).to have_received(:refresh!).with(user)
    end

    it "wraps Google API errors" do
      allow(mock_drive_service).to receive(:get_file)
        .and_raise(Google::Apis::ClientError.new("Not Found", status_code: 404))

      expect { service.get_file("bad-id") }
        .to raise_error(GoogleApiError) { |error| expect(error.status_code).to eq(404) }
    end
  end

  describe "#share_file" do
    it "creates a permission and returns share metadata" do
      permission = instance_double(Google::Apis::DriveV3::Permission, id: "perm-1")
      allow(mock_drive_service).to receive(:create_permission).and_return(permission)

      result = service.share_file("file-123", email: "student@example.com", role: "writer")

      expect(result).to eq({
        id: "perm-1",
        email: "student@example.com",
        role: "writer",
        type: "user"
      })
    end
  end

  describe "#share_file_batch" do
    it "collects successes and failures" do
      allow(service).to receive(:share_file).with("file-123", email: "one@example.com", role: "reader")
        .and_return({ id: "perm-1", email: "one@example.com", role: "reader", type: "user" })
      allow(service).to receive(:share_file).with("file-123", email: "two@example.com", role: "reader")
        .and_raise(GoogleApiError.new("Permission denied", status_code: 403))
      allow(Rails.logger).to receive(:warn)

      result = service.share_file_batch("file-123", emails: %w[one@example.com two@example.com])

      expect(result[:shared].size).to eq(1)
      expect(result[:failed]).to eq([ { email: "two@example.com", error: "Permission denied" } ])
    end
  end

  describe "#create_folder" do
    it "creates a Drive folder" do
      folder = Google::Apis::DriveV3::File.new(
        id: "folder-1",
        name: "Assignments",
        mime_type: "application/vnd.google-apps.folder",
        web_view_link: "https://drive.google.com/drive/folders/folder-1"
      )
      allow(mock_drive_service).to receive(:create_file).and_return(folder)

      result = service.create_folder("Assignments")

      expect(result[:id]).to eq("folder-1")
      expect(result[:file_icon]).to eq("folder")
    end
  end

  describe "#copy_file" do
    it "copies a file and returns copied metadata" do
      file = Google::Apis::DriveV3::File.new(
        id: "copy-1",
        name: "Copy",
        mime_type: "application/vnd.google-apps.document",
        web_view_link: "https://docs.google.com/document/d/copy-1"
      )
      allow(mock_drive_service).to receive(:copy_file).and_return(file)

      result = service.copy_file("template-1", new_name: "Copy")

      expect(result[:id]).to eq("copy-1")
      expect(result[:name]).to eq("Copy")
    end
  end

  describe "#list_files" do
    it "lists files in a folder with query filters" do
      file = Google::Apis::DriveV3::File.new(
        id: "file-1",
        name: "Worksheet",
        mime_type: "application/pdf",
        web_view_link: "https://drive.google.com/file/d/file-1"
      )
      response = instance_double(Google::Apis::DriveV3::FileList, files: [ file ])
      allow(mock_drive_service).to receive(:list_files).and_return(response)

      result = service.list_files(folder_id: "folder-1", query: "name contains 'Work'", page_size: 25)

      expect(mock_drive_service).to have_received(:list_files).with(
        q: "'folder-1' in parents and name contains 'Work' and trashed = false",
        page_size: 25,
        fields: "files(#{GoogleDriveService::GOOGLE_FIELDS}),nextPageToken"
      )
      expect(result.first[:id]).to eq("file-1")
    end
  end

  describe ".file_icon" do
    it "maps common mime types to icon keys" do
      expect(described_class.file_icon("application/vnd.google-apps.document")).to eq("doc")
      expect(described_class.file_icon("application/vnd.google-apps.spreadsheet")).to eq("sheet")
      expect(described_class.file_icon("application/pdf")).to eq("pdf")
      expect(described_class.file_icon("application/octet-stream")).to eq("file")
    end
  end
end
