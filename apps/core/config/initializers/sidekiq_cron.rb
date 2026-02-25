return if Rails.env.test?
return unless defined?(Sidekiq::Cron::Job)
return unless defined?(Sidekiq) && Sidekiq.server?

Sidekiq::Cron::Job.load_from_hash(
  "refresh_analytics_views_every_hour" => {
    "class" => "RefreshAnalyticsViewsJob",
    "cron" => "0 * * * *",
    "queue" => "low",
    "description" => "Refresh analytics materialized views hourly"
  },
  "evaluate_alerts_every_5_minutes" => {
    "class" => "AlertEvaluationJob",
    "cron" => "*/5 * * * *",
    "queue" => "default",
    "description" => "Evaluate alert configurations every 5 minutes"
  },
  "uptime_monitor_every_2_minutes" => {
    "class" => "UptimeMonitorJob",
    "cron" => "*/2 * * * *",
    "queue" => "default",
    "description" => "Check uptime for core endpoints every 2 minutes"
  },
  "daily_database_backup" => {
    "class" => "DatabaseBackupJob",
    "cron" => "0 2 * * *",
    "queue" => "low",
    "args" => [
      {
        "backup_type" => "full"
      }
    ],
    "description" => "Daily full database backup at 2 AM"
  }
)
