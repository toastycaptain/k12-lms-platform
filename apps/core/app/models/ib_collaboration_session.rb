class IbCollaborationSession < ApplicationRecord
  include TenantScoped

  STATUS_TYPES = %w[active reconnecting paused ended expired].freeze
  ROLE_TYPES = %w[editor reviewer observer specialist coordinator].freeze

  belongs_to :school, optional: true
  belongs_to :curriculum_document
  belongs_to :user

  validates :status, inclusion: { in: STATUS_TYPES }
  validates :role, inclusion: { in: ROLE_TYPES }
  validates :session_key, :scope_type, :scope_key, :last_seen_at, presence: true

  before_validation :normalize_payloads

  scope :active_now, -> { where(status: %w[active reconnecting]).where("last_seen_at >= ?", 2.minutes.ago) }

  private

  def normalize_payloads
    self.metadata = {} unless metadata.is_a?(Hash)
  end
end
