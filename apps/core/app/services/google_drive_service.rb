class GoogleDriveService
  attr_reader :user, :service

  def initialize(user)
    @user = user
    @service = Google::Apis::DriveV3::DriveService.new
    token_service = GoogleTokenService.new(user)
    @service.authorization = Google::Auth::UserRefreshCredentials.new(
      client_id: ENV.fetch("GOOGLE_CLIENT_ID", "test-client-id"),
      client_secret: ENV.fetch("GOOGLE_CLIENT_SECRET", "test-client-secret"),
      scope: [],
      additional_parameters: {}
    )
    @service.authorization.access_token = token_service.access_token
    @service.authorization.refresh_token = user.google_refresh_token
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
