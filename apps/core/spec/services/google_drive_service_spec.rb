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
  let(:mock_authorization) { instance_double(Google::Auth::UserRefreshCredentials, "access_token=": nil, "refresh_token=": nil) }
  let(:service) { described_class.new(user) }

  before do
    allow(Google::Apis::DriveV3::DriveService).to receive(:new).and_return(mock_drive_service)
    allow(mock_drive_service).to receive(:authorization=)
    allow(mock_drive_service).to receive(:authorization).and_return(mock_authorization)
  end

  describe "#create_document" do
    it "creates a Google Doc and returns metadata" do
      file = Google::Apis::DriveV3::File.new(
        id: "doc-123",
        name: "My Document",
        mime_type: "application/vnd.google-apps.document",
        web_view_link: "https://docs.google.com/document/d/doc-123"
      )
      allow(mock_drive_service).to receive(:create_file).and_return(file)

      result = service.create_document("My Document")

      expect(result[:id]).to eq("doc-123")
      expect(result[:title]).to eq("My Document")
      expect(result[:url]).to eq("https://docs.google.com/document/d/doc-123")
      expect(result[:mime_type]).to eq("application/vnd.google-apps.document")
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

    it "wraps Google API errors" do
      allow(mock_drive_service).to receive(:get_file)
        .and_raise(Google::Apis::ClientError.new("Not Found", status_code: 404))

      expect { service.get_file("bad-id") }.to raise_error(GoogleApiError)
    end
  end
end
