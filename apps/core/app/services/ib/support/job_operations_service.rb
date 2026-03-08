module Ib
  module Support
    class JobOperationsService
      def initialize(tenant:, school:, actor: nil)
        @tenant = tenant
        @school = school
        @actor = actor
      end

      def build
        {
          inventory: inventory,
          queue_health: queue_health,
          attention_summary: attention_summary,
          failures: failures,
          recent_events: recent_events,
          generated_at: Time.current.utc.iso8601
        }
      end

      def replay!(operation_type:, id:)
        result = case normalize_operation_type(operation_type)
        when "standards_export"
          replay_standards_export!(id)
        when "publishing_dispatch"
          replay_publishing_dispatch!(id)
        when "pilot_setup"
          replay_pilot_setup!(id)
        when "import_execute"
          replay_import_execute!(id)
        when "analytics_backfill"
          request_analytics_backfill!
        else
          raise ArgumentError, "Unsupported replay operation #{operation_type}"
        end

        Telemetry.emit(
          event: "ib.job_operations.replay",
          tenant: tenant,
          user: actor,
          school: school,
          metadata: { operation_type: normalize_operation_type(operation_type), id: id }
        )
        result
      end

      def cancel!(job_id:, reason: nil)
        job = scoped_jobs.find(job_id)
        OperationalJobTracker.mark_recovery!(
          record: job,
          actor: actor,
          action: "cancel",
          payload: { reason: reason.presence || "Admin cancellation requested." }
        )
        job
      end

      def backfill!(kind:)
        case kind.to_s
        when "analytics"
          request_analytics_backfill!
        else
          raise ArgumentError, "Unsupported backfill kind #{kind}"
        end
      end

      private

      attr_reader :tenant, :school, :actor

      def inventory
        JobCatalogService.inventory.map do |item|
          definition = item.deep_dup
          definition[:retry] = definition.delete(:retry_policy).fetch(:mode)
          definition[:idempotency_rule] = definition.delete(:idempotency_rule)
          definition[:replay_supported] = definition[:replay_supported]
          definition[:cancel_supported] = definition[:cancel_supported]
          definition
        end
      end

      def queue_health
        JobCatalogService.inventory.group_by { |row| row[:queue] }.map do |queue_name, definitions|
          queue = Sidekiq::Queue.new(queue_name)
          {
            queue: queue_name,
            depth: queue.size,
            latency_seconds: queue.latency.round(2),
            operations: definitions.map { |row| row[:key] },
            status: if queue.size > 200
              "critical"
                    elsif queue.latency > 30
              "warning"
                    else
              "healthy"
                    end
          }
        rescue StandardError => e
          {
            queue: queue_name,
            depth: -1,
            latency_seconds: -1,
            operations: definitions.map { |row| row[:key] },
            status: "critical",
            error: e.message
          }
        end
      end

      def attention_summary
        {
          queued: scoped_jobs.where(status: "queued").count,
          running: scoped_jobs.where(status: "running").count,
          failed: scoped_jobs.where(status: "failed").count,
          dead_letter: scoped_jobs.where(status: "dead_letter").count,
          recovered: scoped_jobs.where(status: "recovered").count
        }
      end

      def failures
        rows = tracked_failures + legacy_failures
        rows.sort_by { |row| row[:happened_at] }.reverse
      end

      def recent_events
        scoped_events.order(occurred_at: :desc, id: :desc).limit(12).map do |event|
          {
            id: event.id,
            job_id: event.ib_operational_job_id,
            event_type: event.event_type,
            message: event.message,
            occurred_at: event.occurred_at.utc.iso8601,
            payload: event.payload
          }
        end
      end

      def tracked_failures
        scoped_jobs.attention_needed.order(updated_at: :desc, id: :desc).map do |job|
          {
            id: job.id,
            operation_type: job.operation_key,
            title: "#{job.operation_key.humanize} needs recovery",
            detail: job.last_error_message.presence || "Operational job requires recovery.",
            happened_at: job.updated_at.utc.iso8601,
            queue: job.queue_name,
            correlation_id: job.correlation_id,
            runbook_url: job.runbook_url
          }
        end
      end

      def legacy_failures
        export_failures + publishing_failures + setup_failures + import_failures + report_failures
      end

      def export_failures
        IbStandardsExport.where(tenant_id: tenant.id, school_id: school.id, status: "failed").map do |export|
          {
            id: export.id,
            operation_type: "standards_export",
            title: "Standards export failed",
            detail: export.error_message.presence || "Export artifact generation failed.",
            happened_at: export.updated_at.utc.iso8601
          }
        end
      end

      def publishing_failures
        IbPublishingAudit.where(tenant_id: tenant.id, school_id: school.id, event_type: "publish_failed").map do |audit|
          {
            id: audit.ib_publishing_queue_item_id,
            operation_type: "publishing_dispatch",
            title: "Publishing queue item failed",
            detail: audit.details["message"].presence || "Publish dispatch failed.",
            happened_at: audit.created_at.utc.iso8601
          }
        end
      end

      def setup_failures
        IbPilotSetup.where(tenant_id: tenant.id, school_id: school.id, status: %w[blocked paused]).map do |setup|
          {
            id: setup.id,
            operation_type: "pilot_setup",
            title: "Pilot setup needs attention",
            detail: setup.paused_reason.presence || "Pilot setup is blocked and needs recompute.",
            happened_at: setup.updated_at.utc.iso8601
          }
        end
      end

      def import_failures
        IbImportBatch.where(tenant_id: tenant.id, school_id: school.id, status: %w[failed blocked]).map do |batch|
          {
            id: batch.id,
            operation_type: "import_execute",
            title: "Import batch blocked or failed",
            detail: batch.error_message.presence || "Import dry-run or execution requires follow-up.",
            happened_at: batch.updated_at.utc.iso8601
          }
        end
      end

      def report_failures
        IbReportDelivery.where(tenant_id: tenant.id, school_id: school.id, status: "failed").map do |delivery|
          {
            id: delivery.id,
            operation_type: "report_delivery",
            title: "Report delivery failed",
            detail: delivery.failure_payload["message"].presence || "Report delivery failed before guardian/student release.",
            happened_at: delivery.updated_at.utc.iso8601
          }
        end
      end

      def replay_standards_export!(id)
        export = IbStandardsExport.find(id)
        result = Ib::Standards::ExportService.enqueue!(packet: export.ib_standards_packet, initiated_by: actor || export.initiated_by)
        mark_recovered!(operation_key: "standards_export", source_record: export)
        result
      end

      def replay_publishing_dispatch!(id)
        queue_item = IbPublishingQueueItem.find(id)
        result = Ib::Publishing::DispatchService.enqueue_publish!(queue_item: queue_item, actor: actor || queue_item.created_by)
        mark_recovered!(operation_key: "publishing_dispatch", source_record: queue_item)
        result
      end

      def replay_pilot_setup!(id)
        setup = IbPilotSetup.find(id)
        result = PilotSetupMutationService.new(
          tenant: setup.tenant,
          school: setup.school,
          actor: actor || setup.updated_by || setup.created_by,
          programme: setup.programme
        ).validate!
        mark_recovered!(operation_key: "pilot_setup", source_record: setup)
        result
      end

      def replay_import_execute!(id)
        batch = IbImportBatch.find(id)
        service = Ib::Migration::ImportBatchService.new(
          tenant: batch.tenant,
          school: batch.school,
          actor: actor || batch.executed_by || batch.initiated_by
        )
        result = batch.executable? ? service.execute!(batch: batch, async: true) : service.dry_run!(batch: batch)
        mark_recovered!(operation_key: "import_execute", source_record: batch)
        result
      end

      def request_analytics_backfill!
        job = AnalyticsBackfillJob.perform_later(tenant.id, school.id, actor&.id)
        tracked = OperationalJobTracker.register_enqueue!(
          job: job,
          operation_key: "analytics_backfill",
          tenant: tenant,
          school: school,
          actor: actor,
          payload: {
            requested_by_id: actor&.id,
            surface: "job_operations"
          },
          idempotency_key: "#{tenant.id}:#{school.id}:#{Time.current.utc.to_date}"
        )
        OperationalJobTracker.mark_recovery!(record: tracked, actor: actor, action: "backfill", payload: { kind: "analytics" })
        tracked
      end

      def mark_recovered!(operation_key:, source_record:)
        record = scoped_jobs.attention_needed.where(operation_key: operation_key, source_record: source_record).order(updated_at: :desc, id: :desc).first
        return if record.nil?

        OperationalJobTracker.mark_recovery!(record: record, actor: actor, action: "replay", payload: { source_record: "#{source_record.class.name}:#{source_record.id}" })
      end

      def normalize_operation_type(value)
        case value.to_s
        when "publishing_queue_item" then "publishing_dispatch"
        when "import_batch" then "import_execute"
        else value.to_s
        end
      end

      def scoped_jobs
        scope = IbOperationalJob.where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school
        scope
      end

      def scoped_events
        scope = IbOperationalJobEvent.where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school
        scope
      end
    end
  end
end
