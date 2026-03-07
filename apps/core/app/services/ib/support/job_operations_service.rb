module Ib
  module Support
    class JobOperationsService
      INVENTORY = [
        { key: "publishing_dispatch", queue: "ib_publishing", retry: "manual_or_auto", idempotency_rule: "queue_item publish token", replay_supported: true },
        { key: "digest_scheduler", queue: "ib_publishing", retry: "manual", idempotency_rule: "story cadence + queue item", replay_supported: true },
        { key: "standards_export", queue: "ib_exports", retry: "manual_or_auto", idempotency_rule: "export snapshot id", replay_supported: true },
        { key: "pilot_readiness_refresh", queue: "ib_support", retry: "manual", idempotency_rule: "school + timestamp", replay_supported: true },
        { key: "import_execute", queue: "ib_imports", retry: "manual", idempotency_rule: "batch checksum + status", replay_supported: true }
      ].freeze

      def initialize(tenant:, school:, actor: nil)
        @tenant = tenant
        @school = school
        @actor = actor
      end

      def build
        {
          inventory: INVENTORY,
          failures: failures,
          generated_at: Time.current.utc.iso8601
        }
      end

      def replay!(operation_type:, id:)
        result = case operation_type.to_s
        when "standards_export"
          export = IbStandardsExport.find(id)
          Ib::Standards::ExportService.enqueue!(packet: export.ib_standards_packet, initiated_by: actor || export.initiated_by)
        when "publishing_queue_item"
          queue_item = IbPublishingQueueItem.find(id)
          Ib::Publishing::DispatchService.new(queue_item: queue_item, actor: actor || queue_item.created_by).publish_now!
        when "pilot_setup"
          setup = IbPilotSetup.find(id)
          Ib::Support::PilotSetupMutationService.new(tenant: setup.tenant, school: setup.school, actor: actor || setup.updated_by || setup.created_by, programme: setup.programme).validate!
        when "import_batch"
          batch = IbImportBatch.find(id)
          service = Ib::Migration::ImportBatchService.new(tenant: batch.tenant, school: batch.school, actor: actor || batch.executed_by || batch.initiated_by)
          batch.executable? ? service.execute!(batch: batch) : service.dry_run!(batch: batch)
        else
          raise ArgumentError, "Unsupported replay operation #{operation_type}"
        end

        Ib::Support::Telemetry.emit(
          event: "ib.job_operations.replay",
          tenant: tenant,
          user: actor,
          school: school,
          metadata: { operation_type: operation_type.to_s, id: id },
        )
        result
      end

      private

      attr_reader :tenant, :school, :actor

      def failures
        export_failures = IbStandardsExport.where(tenant_id: tenant.id, school_id: school.id, status: "failed").map do |export|
          {
            id: export.id,
            operation_type: "standards_export",
            title: "Standards export failed",
            detail: export.error_message.presence || "Export artifact generation failed.",
            happened_at: export.updated_at.utc.iso8601
          }
        end

        publishing_failures = IbPublishingAudit.where(tenant_id: tenant.id, school_id: school.id, event_type: "publish_failed").map do |audit|
          {
            id: audit.ib_publishing_queue_item_id,
            operation_type: "publishing_queue_item",
            title: "Publishing queue item failed",
            detail: audit.details["message"].presence || "Publish dispatch failed.",
            happened_at: audit.created_at.utc.iso8601
          }
        end

        setup_failures = IbPilotSetup.where(tenant_id: tenant.id, school_id: school.id, status: %w[blocked paused]).map do |setup|
          {
            id: setup.id,
            operation_type: "pilot_setup",
            title: "Pilot setup needs attention",
            detail: setup.paused_reason.presence || "Pilot setup is blocked and needs recompute.",
            happened_at: setup.updated_at.utc.iso8601
          }
        end

        import_failures = IbImportBatch.where(tenant_id: tenant.id, school_id: school.id, status: %w[failed blocked]).map do |batch|
          {
            id: batch.id,
            operation_type: "import_batch",
            title: "Import batch blocked or failed",
            detail: batch.error_message.presence || "Import dry-run or execution requires follow-up.",
            happened_at: batch.updated_at.utc.iso8601
          }
        end

        (export_failures + publishing_failures + setup_failures + import_failures).sort_by { |failure| failure[:happened_at] }.reverse
      end
    end
  end
end
