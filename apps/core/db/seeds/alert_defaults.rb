# Default system-wide alert configurations.
defaults = [
  { name: "High DB Connection Pool Usage", metric: "db_connection_pool", comparison: "gt", threshold: 80, severity: "warning" },
  { name: "Critical DB Connection Pool", metric: "db_connection_pool", comparison: "gt", threshold: 95, severity: "critical" },
  { name: "Slow DB Response", metric: "db_response_time", comparison: "gt", threshold: 500, severity: "warning" },
  { name: "Sidekiq Queue Backlog", metric: "sidekiq_queue_depth", comparison: "gt", threshold: 100, severity: "warning" },
  { name: "Critical Sidekiq Backlog", metric: "sidekiq_queue_depth", comparison: "gt", threshold: 1000, severity: "critical" },
  { name: "Sidekiq High Latency", metric: "sidekiq_latency", comparison: "gt", threshold: 60, severity: "warning" },
  { name: "High Memory Usage", metric: "memory_usage_percent", comparison: "gt", threshold: 85, severity: "warning" },
  { name: "Stale Backup", metric: "backup_age_hours", comparison: "gt", threshold: 48, severity: "critical" }
].freeze

defaults.each do |attrs|
  AlertConfiguration.find_or_create_by!(name: attrs[:name]) do |config|
    config.assign_attributes(
      attrs.merge(
        enabled: true,
        notification_channel: "slack",
        cooldown_minutes: 30
      )
    )
  end
end
