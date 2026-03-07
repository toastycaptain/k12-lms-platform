class IbCollaborationTask < ApplicationRecord
  include TenantScoped

  STATUS_TYPES = %w[open in_progress blocked done archived].freeze
  PRIORITY_TYPES = %w[low medium high urgent].freeze

  belongs_to :school, optional: true
  belongs_to :curriculum_document, optional: true
  belongs_to :created_by, class_name: "User", optional: true
  belongs_to :assigned_to, class_name: "User", optional: true

  validates :title, presence: true
  validates :status, inclusion: { in: STATUS_TYPES }
  validates :priority, inclusion: { in: PRIORITY_TYPES }

  before_validation :normalize_payloads

  private

  def normalize_payloads
    self.mention_payload = {} unless mention_payload.is_a?(Hash)
    self.metadata = {} unless metadata.is_a?(Hash)
  end
end
