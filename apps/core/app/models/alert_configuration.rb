class AlertConfiguration < ApplicationRecord
  belongs_to :tenant, optional: true

  VALID_METRICS = %w[
    db_connection_pool
    db_response_time
    response_time_p95
    error_rate_5m
    sidekiq_queue_depth
    sidekiq_latency
    disk_usage_percent
    memory_usage_percent
    redis_memory
    active_storage_health
    ai_gateway_health
    backup_age_hours
  ].freeze
  VALID_COMPARISONS = %w[gt lt gte lte eq].freeze
  VALID_SEVERITIES = %w[info warning critical].freeze
  VALID_CHANNELS = %w[slack email].freeze

  validates :name, presence: true
  validates :metric, presence: true, inclusion: { in: VALID_METRICS }
  validates :comparison, presence: true, inclusion: { in: VALID_COMPARISONS }
  validates :threshold, presence: true, numericality: true
  validates :severity, presence: true, inclusion: { in: VALID_SEVERITIES }
  validates :notification_channel, presence: true, inclusion: { in: VALID_CHANNELS }

  scope :enabled, -> { where(enabled: true) }
  scope :system_wide, -> { where(tenant_id: nil) }

  def evaluate(current_value)
    case comparison
    when "gt" then current_value > threshold
    when "lt" then current_value < threshold
    when "gte" then current_value >= threshold
    when "lte" then current_value <= threshold
    when "eq" then current_value == threshold
    else false
    end
  end

  def in_cooldown?
    return false unless last_triggered_at

    last_triggered_at > cooldown_minutes.minutes.ago
  end

  def trigger!
    update!(
      last_triggered_at: Time.current,
      trigger_count: trigger_count + 1
    )
  end
end
