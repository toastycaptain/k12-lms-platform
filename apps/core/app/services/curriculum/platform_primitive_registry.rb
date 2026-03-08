module Curriculum
  class PlatformPrimitiveRegistry
    SHARED_PRIMITIVES = {
      pack_schema: {
        label: "Pack schema and normalization",
        services: %w[
          CurriculumProfileRegistry
          CurriculumPackStore
          Curriculum::PackCapabilitySchema
        ],
        future_pack_ready: true
      },
      document_templates: {
        label: "Document template engine",
        services: %w[
          Curriculum::DocumentTemplateRegistry
          Curriculum::PackSchemaResolver
          Curriculum::DocumentContentService
        ],
        future_pack_ready: true
      },
      workflow_templates: {
        label: "Workflow template engine",
        services: %w[
          Curriculum::WorkflowTemplateLibrary
          Curriculum::WorkflowRegistry
          Curriculum::WorkflowEngine
        ],
        future_pack_ready: true
      },
      reporting_engine: {
        label: "Reporting generation and render hooks",
        services: %w[
          Curriculum::ReportingEngine
          Ib::Reporting::ReportService
        ],
        future_pack_ready: true
      },
      publishing_engine: {
        label: "Evidence, story, and family publishing",
        services: %w[
          Curriculum::PublishingCapability
          Ib::Publishing::DispatchService
        ],
        future_pack_ready: true
      },
      migration_sdk: {
        label: "Migration connector SDK",
        services: %w[
          Curriculum::MigrationConnectorSDK
          Ib::Migration::ContractRegistry
          Ib::Migration::SessionService
        ],
        future_pack_ready: true
      },
      governance_console: {
        label: "Governance, rollout, and readiness consoles",
        services: %w[
          Curriculum::GovernanceConsoleRegistry
          Ib::Governance::RolloutConsoleService
          Ib::Support::PilotReadinessService
        ],
        future_pack_ready: true
      }
    }.freeze

    IB_SPECIFIC_PRIMITIVES = {
      programme_routes: {
        label: "IB route families",
        services: %w[Ib::RouteBuilder apps/web/src/features/ib/core/route-registry.ts],
        reason: "Programme-specific information architecture still belongs to the IB pack."
      },
      programme_operational_records: {
        label: "IB operational record families",
        services: %w[IbOperationalRecord apps/web/src/features/ib/dp/DpWorkspaces.tsx],
        reason: "Record families are curriculum-specific even though the workflow engine is reusable."
      },
      programme_reporting_families: {
        label: "IB report family composers",
        services: %w[Ib::Reporting::ReportService apps/web/src/features/ib/reports/IbReportsWorkspace.tsx],
        reason: "Narrative composition stays pack-specific while render/release infrastructure is shared."
      }
    }.freeze

    class << self
      def inventory
        {
          schema_version: "phase10.v1",
          shared: SHARED_PRIMITIVES.deep_dup,
          ib_specific: IB_SPECIFIC_PRIMITIVES.deep_dup
        }
      end

      def shared_keys
        SHARED_PRIMITIVES.keys.map(&:to_s)
      end

      def ib_specific_keys
        IB_SPECIFIC_PRIMITIVES.keys.map(&:to_s)
      end
    end
  end
end
