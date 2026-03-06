class IbDocumentCollaborator < ApplicationRecord
  include TenantScoped

  ROLE_TYPES = %w[owner co_planner specialist_contributor reviewer advisor].freeze
  STATUS_TYPES = %w[active requested archived].freeze
  CONTRIBUTION_MODES = %w[full comment evidence resource support_note].freeze

  belongs_to :curriculum_document
  belongs_to :user
  belongs_to :assigned_by, class_name: "User", optional: true

  validates :role, inclusion: { in: ROLE_TYPES }
  validates :status, inclusion: { in: STATUS_TYPES }
  validates :contribution_mode, inclusion: { in: CONTRIBUTION_MODES }
  validates :user_id, uniqueness: { scope: [ :curriculum_document_id, :role ] }

  scope :active, -> { where(status: "active") }
end
