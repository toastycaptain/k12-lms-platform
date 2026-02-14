class AuditLog < ApplicationRecord
  include TenantScoped

  belongs_to :actor, class_name: "User", optional: true
  belongs_to :auditable, polymorphic: true, optional: true

  validates :event_type, presence: true

  scope :recent, -> { order(created_at: :desc) }

  before_update { raise ActiveRecord::ReadOnlyRecord }
  before_destroy { raise ActiveRecord::ReadOnlyRecord }
end
