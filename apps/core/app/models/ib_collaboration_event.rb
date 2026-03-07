class IbCollaborationEvent < ApplicationRecord
  include TenantScoped

  EVENT_TYPES = %w[join leave section_focus lock_acquire lock_release change_patch suggestion task mention approval_request replay_event].freeze

  belongs_to :school, optional: true
  belongs_to :curriculum_document, optional: true
  belongs_to :ib_collaboration_session, optional: true
  belongs_to :user, optional: true

  validates :event_name, presence: true
  validates :scope_key, :occurred_at, presence: true

  before_validation :normalize_payloads

  private

  def normalize_payloads
    self.payload = {} unless payload.is_a?(Hash)
  end
end
