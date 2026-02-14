class GoogleDriveService
  attr_reader :user, :service

  def initialize(user)
    @user = user
    @service = Google::Apis::DriveV3::DriveService.new
    @service.authorization = GoogleTokenService.new(user).google_credentials
  end

  def create_document(title, mime_type: "application/vnd.google-apps.document")
    file_metadata = Google::Apis::DriveV3::File.new(
      name: title,
      mime_type: mime_type
    )
    result = service.create_file(file_metadata, fields: "id,name,mimeType,webViewLink")
    {
      id: result.id,
      title: result.name,
      url: result.web_view_link,
      mime_type: result.mime_type
    }
  rescue Google::Apis::Error => e
    raise GoogleApiError.new(e.message, status_code: e.status_code)
  end

  def create_presentation(title)
    create_document(title, mime_type: "application/vnd.google-apps.presentation")
  end

  def get_file(file_id)
    result = service.get_file(file_id, fields: "id,name,mimeType,webViewLink")
    {
      id: result.id,
      name: result.name,
      mime_type: result.mime_type,
      url: result.web_view_link
    }
  rescue Google::Apis::Error => e
    raise GoogleApiError.new(e.message, status_code: e.status_code)
  end
end
