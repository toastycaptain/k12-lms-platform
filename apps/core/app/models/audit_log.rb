class AuditLog < ApplicationRecord
  include TenantScoped

  VALID_ACTIONS = %w[create update destroy publish archive approve reject sign_in sign_out export sync ai_generate].freeze

  belongs_to :user, optional: true
  belongs_to :auditable, polymorphic: true, optional: true

  validates :action, presence: true, inclusion: { in: VALID_ACTIONS }

  scope :for_user, ->(user_id) { where(user_id: user_id) }
  scope :for_auditable, ->(type, id) { where(auditable_type: type, auditable_id: id) }
  scope :for_action, ->(action) { where(action: action) }
  scope :recent, -> { order(created_at: :desc) }
end
