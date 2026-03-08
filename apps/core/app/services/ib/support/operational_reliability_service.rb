module Ib
  module Support
    class OperationalReliabilityService
      QUERY_THRESHOLDS = {
        warning_ms: 250,
        critical_ms: 500,
        max_large_school_queue_depth: 200,
        max_large_school_queue_latency_seconds: 30
      }.freeze

      LOAD_REHEARSALS = [
        {
          key: "k6_reliability",
          label: "K6 reliability smoke",
          path: "infrastructure/phase10/load/ib_reliability.js"
        },
        {
          key: "chaos_drill",
          label: "Queue and storage chaos drill",
          path: "infrastructure/phase10/load/ib_chaos_drill.sh"
        }
      ].freeze

      def initialize(tenant:, school: nil)
        @tenant = tenant
        @school = school
      end

      def build
        {
          generated_at: Time.current.utc.iso8601,
          failure_domains: failure_domains,
          queue_health: queue_health,
          recovery_summary: recovery_summary,
          slo_summary: slo_summary,
          trace_summary: trace_summary,
          sentry_summary: sentry_summary,
          query_observability: query_observability,
          load_rehearsals: LOAD_REHEARSALS
        }
      end

      private

      attr_reader :tenant, :school

      def job_scope
        scope = IbOperationalJob.where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school
        scope
      end

      def failure_domains
        JobCatalogService.inventory.map do |definition|
          jobs = job_scope.where(operation_key: definition[:key])
          {
            key: definition[:key],
            queue: definition[:queue],
            runbook_url: definition[:runbook_url],
            total_jobs: jobs.count,
            failed_jobs: jobs.attention_needed.count,
            active_jobs: jobs.active.count,
            last_failure_at: jobs.attention_needed.maximum(:updated_at)&.utc&.iso8601
          }
        end
      end

      def queue_health
        JobCatalogService.inventory.group_by { |row| row[:queue] }.map do |queue_name, definitions|
          queue = Sidekiq::Queue.new(queue_name)
          {
            queue: queue_name,
            depth: queue.size,
            latency_seconds: queue.latency.round(2),
            operations: definitions.map { |definition| definition[:key] },
            status: queue_status(queue)
          }
        rescue StandardError => e
          {
            queue: queue_name,
            depth: -1,
            latency_seconds: -1,
            operations: definitions.map { |definition| definition[:key] },
            status: "critical",
            error: e.message
          }
        end
      end

      def recovery_summary
        {
          queued: job_scope.where(status: "queued").count,
          running: job_scope.where(status: "running").count,
          failed: job_scope.where(status: "failed").count,
          dead_letter: job_scope.where(status: "dead_letter").count,
          recent_failures: job_scope.attention_needed.order(updated_at: :desc, id: :desc).limit(10).map do |job|
            {
              id: job.id,
              operation_key: job.operation_key,
              status: job.status,
              queue_name: job.queue_name,
              last_error_message: job.last_error_message,
              correlation_id: job.correlation_id,
              runbook_url: job.runbook_url,
              updated_at: job.updated_at.utc.iso8601
            }
          end
        }
      end

      def slo_summary
        health = SystemHealthService.check_all
        totals = job_scope.where.not(status: "cancelled")
        succeeded = totals.where(status: %w[succeeded recovered]).count
        total = totals.count
        success_rate = total.positive? ? ((succeeded.to_f / total) * 100).round(2) : 100.0

        [
          {
            key: "api_availability",
            label: "Core API health",
            objective: "99.5%",
            current_value: health[:overall] == "critical" ? "degraded" : "healthy",
            status: health[:overall] == "critical" ? "risk" : "success"
          },
          {
            key: "async_success_rate",
            label: "Operational job success rate",
            objective: ">= 98%",
            current_value: "#{success_rate}%",
            status: success_rate >= 98 ? "success" : "risk"
          },
          {
            key: "queue_latency",
            label: "Queue latency",
            objective: "<= 30s",
            current_value: "#{health.dig(:metrics, :sidekiq_latency)}s",
            status: health.dig(:metrics, :sidekiq_latency).to_f <= QUERY_THRESHOLDS[:max_large_school_queue_latency_seconds] ? "success" : "warm"
          }
        ]
      end

      def trace_summary
        {
          enabled: ENV.fetch("IB_TRACE_LOGGING_ENABLED", "true") != "false",
          trace_id: Current.trace_id,
          correlation_id: Current.correlation_id,
          request_id: Current.request_id,
          strategy: "w3c_traceparent_plus_structured_logs"
        }
      end

      def sentry_summary
        {
          configured: ENV["SENTRY_DSN"].present?,
          traces_sample_rate: ENV.fetch("SENTRY_TRACES_SAMPLE_RATE", 0.1).to_f,
          error_budget: {
            daily_failure_threshold: ENV.fetch("IB_ERROR_BUDGET_DAILY_FAILURES", 10).to_i,
            queue_dead_letter_threshold: ENV.fetch("IB_ERROR_BUDGET_DEAD_LETTER", 3).to_i
          }
        }
      end

      def query_observability
        {
          thresholds: QUERY_THRESHOLDS,
          indexed_surfaces: [
            "ib_operational_jobs(status, queue_name)",
            "ib_report_deliveries(status, channel)",
            "ib_publishing_queue_items(state, scheduled_for)",
            "ib_mobile_sync_diagnostics(status, workflow_key)"
          ],
          capacity_notes: [
            "Treat >200 queued IB jobs as a large-school warning.",
            "Treat >30s queue latency as a reliability breach for school-day flows.",
            "Treat >500ms database probe latency as critical."
          ]
        }
      end

      def queue_status(queue)
        return "critical" if queue.size > QUERY_THRESHOLDS[:max_large_school_queue_depth]
        return "warning" if queue.latency > QUERY_THRESHOLDS[:max_large_school_queue_latency_seconds]

        "healthy"
      end
    end
  end
end
