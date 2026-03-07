module Ib
  module Mobile
    class TrustService
      TRUST_CONTRACT = [
        { key: "evidence_capture", label: "Evidence capture", desktop_first: false },
        { key: "approve_return", label: "Approve or return", desktop_first: false },
        { key: "quick_contribution", label: "Specialist quick contribution", desktop_first: false },
        { key: "exception_triage", label: "Coordinator exception triage", desktop_first: false },
        { key: "report_consumption", label: "Guardian and student report consumption", desktop_first: false },
        { key: "full_planning_studio", label: "Full planning studio", desktop_first: true }
      ].freeze

      def initialize(tenant:, school: nil, actor: nil)
        @tenant = tenant
        @school = school
        @actor = actor
      end

      def index_payload
        {
          generated_at: Time.current.utc.iso8601,
          trust_contract: TRUST_CONTRACT,
          diagnostics: diagnostic_scope.order(updated_at: :desc, id: :desc).map { |row| serialize_diagnostic(row) },
          success_criteria: {
            offline_replay_success_rate: ">= 95%",
            sync_recovery_time: "<= 60s median",
            conflict_visibility: "100% explicit"
          }
        }
      end

      def upsert_diagnostic!(attrs)
        diagnostic = attrs[:id].present? ? diagnostic_scope.find(attrs[:id]) : diagnostic_scope.find_or_initialize_by(workflow_key: attrs[:workflow_key], user: actor)
        diagnostic.assign_attributes(
          school: school,
          user: actor,
          device_class: attrs[:device_class].presence || diagnostic.device_class || "phone",
          workflow_key: attrs[:workflow_key].presence || diagnostic.workflow_key,
          status: attrs[:status].presence || diagnostic.status || "healthy",
          queue_depth: attrs[:queue_depth].to_i,
          last_synced_at: attrs[:last_synced_at].presence || Time.current,
          failure_payload: diagnostic.failure_payload.merge(normalize_hash(attrs[:failure_payload])),
          diagnostics: diagnostic.diagnostics.merge(normalize_hash(attrs[:diagnostics])),
          metadata: diagnostic.metadata.merge(normalize_hash(attrs[:metadata]))
        )
        diagnostic.save!
        serialize_diagnostic(diagnostic)
      end

      private

      attr_reader :tenant, :school, :actor

      def diagnostic_scope
        scope = IbMobileSyncDiagnostic.where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school
        scope
      end

      def serialize_diagnostic(diagnostic)
        {
          id: diagnostic.id,
          device_class: diagnostic.device_class,
          workflow_key: diagnostic.workflow_key,
          status: diagnostic.status,
          queue_depth: diagnostic.queue_depth,
          last_synced_at: diagnostic.last_synced_at&.utc&.iso8601,
          failure_payload: diagnostic.failure_payload,
          diagnostics: diagnostic.diagnostics,
          updated_at: diagnostic.updated_at.utc.iso8601
        }
      end

      def normalize_hash(value)
        value.is_a?(Hash) ? value.deep_stringify_keys : {}
      end
    end
  end
end
