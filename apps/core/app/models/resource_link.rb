class ResourceLink < ApplicationRecord
  include TenantScoped

  VALID_PROVIDERS = %w[google_drive upload url].freeze

  belongs_to :linkable, polymorphic: true

  validates :url, presence: true, format: { with: URI::DEFAULT_PARSER.make_regexp(%w[http https]), message: "must be a valid URL" }
  validates :provider, presence: true, inclusion: { in: VALID_PROVIDERS }
  validate :drive_file_id_required_for_google_drive

  private

  def drive_file_id_required_for_google_drive
    if provider == "google_drive" && drive_file_id.blank?
      errors.add(:drive_file_id, "is required when provider is google_drive")
    end
  end
end
