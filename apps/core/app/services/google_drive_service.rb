class GoogleDriveService
  attr_reader :user, :service

  GOOGLE_FIELDS = "id,name,mimeType,webViewLink,iconLink,thumbnailLink,modifiedTime,size".freeze

  def initialize(user)
    @user = user
    @service = Google::Apis::DriveV3::DriveService.new
    @service.authorization = GoogleTokenService.new(user).google_credentials
  end

  def create_document(title, mime_type: "application/vnd.google-apps.document")
    file_metadata = Google::Apis::DriveV3::File.new(name: title, mime_type: mime_type)
    result = drive_call { service.create_file(file_metadata, fields: GOOGLE_FIELDS) }
    normalize_file(result).merge(title: result.name)
  end

  def create_presentation(title)
    create_document(title, mime_type: "application/vnd.google-apps.presentation")
  end

  def get_file(file_id)
    result = drive_call { service.get_file(file_id, fields: GOOGLE_FIELDS) }
    normalize_file(result)
  end

  def share_file(file_id, email:, role: "reader", type: "user")
    permission = Google::Apis::DriveV3::Permission.new(
      email_address: email,
      role: role,
      type: type
    )
    result = drive_call { service.create_permission(file_id, permission, send_notification_email: false) }
    {
      id: result.id,
      email: email,
      role: role,
      type: type
    }
  end

  def share_file_batch(file_id, emails:, role: "reader")
    shared = []
    failed = []

    Array(emails).each do |email|
      shared << share_file(file_id, email: email, role: role)
    rescue GoogleApiError => e
      Rails.logger.warn("drive.share_file_batch_failed file_id=#{file_id} email=#{email} #{e.message}")
      failed << { email: email, error: e.message }
    end

    { shared: shared, failed: failed }
  end

  def create_folder(name, parent_id: nil)
    folder = Google::Apis::DriveV3::File.new(
      name: name,
      mime_type: "application/vnd.google-apps.folder",
      parents: parent_id.present? ? [ parent_id ] : nil
    )
    result = drive_call { service.create_file(folder, fields: GOOGLE_FIELDS) }
    normalize_file(result)
  end

  def copy_file(file_id, new_name:, folder_id: nil)
    copy = Google::Apis::DriveV3::File.new(
      name: new_name,
      parents: folder_id.present? ? [ folder_id ] : nil
    )
    result = drive_call { service.copy_file(file_id, copy, fields: GOOGLE_FIELDS) }
    normalize_file(result)
  end

  def list_files(folder_id: nil, query: nil, page_size: 50)
    clauses = []
    clauses << "'#{folder_id}' in parents" if folder_id.present?
    clauses << query if query.present?
    clauses << "trashed = false"

    response = drive_call do
      service.list_files(
        q: clauses.join(" and "),
        page_size: page_size,
        fields: "files(#{GOOGLE_FIELDS}),nextPageToken"
      )
    end
    Array(response.files).map { |file| normalize_file(file) }
  end

  def preview_url(file_id)
    "https://drive.google.com/file/d/#{file_id}/preview"
  end

  def self.file_icon(mime_type)
    case mime_type
    when /document/
      "doc"
    when /spreadsheet/
      "sheet"
    when /presentation/
      "slide"
    when /form/
      "form"
    when /folder/
      "folder"
    when /pdf/
      "pdf"
    when /image/
      "image"
    when /video/
      "video"
    else
      "file"
    end
  end

  private

  def drive_call
    with_token_refresh { yield }
  rescue Google::Apis::Error => e
    raise GoogleApiError.new(e.message, status_code: e.status_code)
  end

  def with_token_refresh
    GoogleTokenService.refresh_if_needed!(user)
    yield
  rescue Google::Apis::AuthorizationError
    GoogleTokenService.refresh!(user)
    service.authorization = GoogleTokenService.new(user).google_credentials
    yield
  end

  def normalize_file(file)
    {
      id: file.id,
      name: file.name,
      mime_type: file.mime_type,
      url: file.web_view_link,
      icon_link: file.icon_link,
      thumbnail_link: file.thumbnail_link,
      modified_time: file.modified_time,
      size: file.size,
      file_icon: self.class.file_icon(file.mime_type),
      preview_url: preview_url(file.id)
    }
  end
end
