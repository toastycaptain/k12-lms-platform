module Curriculum
  class PackCapabilitySchema
    SCHEMA_VERSION = "curriculum_pack_vnext.v1".freeze

    class << self
      def normalize(pack:, source: "system")
        pack_data = stringify_keys(pack)
        {
          schema_version: SCHEMA_VERSION,
          pack: {
            key: pack_data.dig("identity", "key") || pack_data["key"],
            version: pack_data.dig("versioning", "version") || pack_data["version"],
            label: pack_data.dig("identity", "label") || pack_data["label"]
          },
          primitives: {
            shared: PlatformPrimitiveRegistry.shared_keys,
            ib_specific: PlatformPrimitiveRegistry.ib_specific_keys
          },
          capabilities: {
            documents: {
              template_catalog: DocumentTemplateRegistry.catalog(pack: pack_data),
              schema_count: stringify_keys(pack_data["document_schemas"] || {}).count
            },
            workflows: {
              templates: WorkflowTemplateLibrary.catalog(pack: pack_data),
              bindings: stringify_keys(pack_data["workflow_bindings"] || {})
            },
            reporting: ReportingEngine.contract_for(pack: pack_data),
            publishing: PublishingCapability.contract_for(pack: pack_data),
            migration: {
              shared_manifest: MigrationConnectorSDK.shared_manifest,
              connectors: MigrationConnectorSDK.connectors
            },
            governance: GovernanceConsoleRegistry.contract_for(pack: pack_data),
            navigation: stringify_keys(pack_data["navigation"] || {})
          },
          backward_compatibility: {
            legacy_schema_version: pack_data.dig("versioning", "schema_version"),
            compatibility: pack_data.dig("versioning", "compatibility"),
            preserves_ib_routes: true,
            preserves_ib_workflows: true
          },
          source: source
        }
      end

      private

      def stringify_keys(value)
        case value
        when Hash
          value.each_with_object({}) { |(key, item), memo| memo[key.to_s] = stringify_keys(item) }
        when Array
          value.map { |item| stringify_keys(item) }
        else
          value
        end
      end
    end
  end
end
