class SyncRun < ApplicationRecord
  include TenantScoped

  VALID_SYNC_TYPES = %w[course_sync roster_sync coursework_push grade_passback].freeze
  VALID_DIRECTIONS = %w[push pull bidirectional].freeze
  VALID_STATUSES = %w[pending running completed failed].freeze

  belongs_to :integration_config
  belongs_to :triggered_by, class_name: "User", optional: true
  has_many :sync_logs, dependent: :destroy

  validates :sync_type, presence: true, inclusion: { in: VALID_SYNC_TYPES }
  validates :direction, presence: true, inclusion: { in: VALID_DIRECTIONS }
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }

  def start!
    update!(started_at: Time.current, status: "running")
  end

  def complete!
    update!(completed_at: Time.current, status: "completed")
  end

  def fail!(message)
    update!(completed_at: Time.current, status: "failed", error_message: message)
  end

  def log_info(message, **opts)
    sync_logs.create!(tenant: tenant, level: "info", message: message, **log_opts(opts))
  end

  def log_warn(message, **opts)
    sync_logs.create!(tenant: tenant, level: "warn", message: message, **log_opts(opts))
  end

  def log_error(message, **opts)
    sync_logs.create!(tenant: tenant, level: "error", message: message, **log_opts(opts))
  end

  private

  def log_opts(opts)
    opts.slice(:entity_type, :entity_id, :external_id, :metadata)
  end
end
