class IbDocumentComment < ApplicationRecord
  include TenantScoped

  COMMENT_TYPES = %w[general field review_note return_note support_note task suggestion mention].freeze
  STATUS_TYPES = %w[open resolved reopened].freeze
  VISIBILITY_TYPES = %w[internal coordinator specialist].freeze

  belongs_to :curriculum_document
  belongs_to :author, class_name: "User"
  belongs_to :parent_comment, class_name: "IbDocumentComment", optional: true
  belongs_to :resolved_by, class_name: "User", optional: true

  has_many :replies, class_name: "IbDocumentComment", foreign_key: :parent_comment_id, dependent: :nullify

  validates :comment_type, inclusion: { in: COMMENT_TYPES }
  validates :status, inclusion: { in: STATUS_TYPES }
  validates :visibility, inclusion: { in: VISIBILITY_TYPES }
  validates :body, presence: true

  scope :open_status, -> { where(status: %w[open reopened]) }

  def resolve!(actor:)
    update!(status: "resolved", resolved_by: actor, resolved_at: Time.current)
  end
end
