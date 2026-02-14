class IntegrationConfig < ApplicationRecord
  include TenantScoped

  VALID_PROVIDERS = %w[google_classroom oneroster].freeze
  VALID_STATUSES = %w[inactive active error].freeze

  belongs_to :created_by, class_name: "User"

  has_many :sync_mappings, dependent: :destroy
  has_many :sync_runs, dependent: :destroy

  has_one_attached :import_file

  validates :provider, presence: true, inclusion: { in: VALID_PROVIDERS }
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }
  validates :provider, uniqueness: { scope: :tenant_id }

  def activate!
    update!(status: "active")
  end

  def deactivate!
    update!(status: "inactive")
  end

  def one_roster_client
    OneRosterClient.new(
      base_url: settings["base_url"],
      client_id: settings["client_id"],
      client_secret: settings["client_secret"]
    )
  end
end
