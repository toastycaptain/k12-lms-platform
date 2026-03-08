module Ib
  module Support
    class JobCatalogService
      RUNBOOK_ROOT = "/admin/ib/runbooks".freeze

      INVENTORY = [
        {
          key: "publishing_dispatch",
          queue: "ib_publishing",
          job_class: "Ib::Publishing::DispatchJob",
          retry_policy: { mode: "manual_or_auto", attempts: 3, wait_seconds: 15, backoff: "exponential", dead_letter: true },
          timeout_seconds: 120,
          idempotency_rule: "queue_item publish token",
          replay_supported: true,
          cancel_supported: false,
          runbook_key: "publishing-queue"
        },
        {
          key: "standards_export",
          queue: "ib_exports",
          job_class: "Ib::Standards::ExportService::ExportJob",
          retry_policy: { mode: "manual_or_auto", attempts: 3, wait_seconds: 15, backoff: "exponential", dead_letter: true },
          timeout_seconds: 180,
          idempotency_rule: "export snapshot digest",
          replay_supported: true,
          cancel_supported: false,
          runbook_key: "standards-export"
        },
        {
          key: "report_delivery",
          queue: "ib_exports",
          job_class: "Ib::Reporting::ReportDeliveryJob",
          retry_policy: { mode: "manual_or_auto", attempts: 3, wait_seconds: 30, backoff: "exponential", dead_letter: true },
          timeout_seconds: 180,
          idempotency_rule: "report version + recipient + channel",
          replay_supported: true,
          cancel_supported: true,
          runbook_key: "reporting-pipeline"
        },
        {
          key: "import_execute",
          queue: "ib_imports",
          job_class: "Ib::Migration::ImportExecutionJob",
          retry_policy: { mode: "manual_or_auto", attempts: 2, wait_seconds: 60, backoff: "linear", dead_letter: true },
          timeout_seconds: 600,
          idempotency_rule: "batch checksum + resume cursor",
          replay_supported: true,
          cancel_supported: true,
          runbook_key: "migration-pipeline"
        },
        {
          key: "analytics_backfill",
          queue: "ib_support",
          job_class: "Ib::Support::AnalyticsBackfillJob",
          retry_policy: { mode: "manual", attempts: 2, wait_seconds: 30, backoff: "linear", dead_letter: false },
          timeout_seconds: 180,
          idempotency_rule: "tenant + school + time window",
          replay_supported: true,
          cancel_supported: false,
          runbook_key: "analytics-backfill"
        },
        {
          key: "alert_evaluation",
          queue: "default",
          job_class: "AlertEvaluationJob",
          retry_policy: { mode: "auto", attempts: 1, wait_seconds: 0, backoff: "none", dead_letter: false },
          timeout_seconds: 30,
          idempotency_rule: "metric window",
          replay_supported: false,
          cancel_supported: false,
          runbook_key: "observability"
        },
        {
          key: "uptime_monitor",
          queue: "default",
          job_class: "UptimeMonitorJob",
          retry_policy: { mode: "auto", attempts: 1, wait_seconds: 0, backoff: "none", dead_letter: false },
          timeout_seconds: 30,
          idempotency_rule: "endpoint health probe window",
          replay_supported: false,
          cancel_supported: false,
          runbook_key: "observability"
        }
      ].freeze

      class << self
        def inventory
          INVENTORY.map { |row| decorate(row) }
        end

        def fetch_by_key(key)
          decorate(INVENTORY.find { |row| row[:key] == key.to_s })
        end

        def fetch_by_job_class(job_class)
          decorate(INVENTORY.find { |row| row[:job_class] == job_class.to_s })
        end

        private

        def decorate(row)
          return nil if row.nil?

          row.merge(runbook_url: "#{RUNBOOK_ROOT}##{row[:runbook_key]}")
        end
      end
    end
  end
end
