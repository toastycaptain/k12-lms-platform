module Curriculum
  class MigrationConnectorSDK
    class << self
      def connector_for(source_system:)
        source = source_system.to_s.presence || "generic"
        protocol = Ib::Migration::ContractRegistry.adapter_protocol_for(source_system: source)
        {
          source_system: source,
          protocol_version: protocol[:protocol_version],
          connector: protocol[:connector],
          supported_kinds: Array(protocol[:supported_kinds]),
          rollout_mode: protocol[:rollout_mode],
          rollback_mode: protocol[:rollback_mode],
          artifact_discovery: Array(protocol[:artifact_discovery]),
          resumable: protocol[:resumable],
          shadow_mode: protocol[:shadow_mode],
          delta_rerun: protocol[:delta_rerun]
        }
      end

      def connectors
        Ib::Migration::ContractRegistry.supported_systems.index_with do |source_system|
          connector_for(source_system: source_system)
        end
      end

      def shared_manifest
        Ib::Migration::ContractRegistry.shared_import_manifest
      end

      def template_generators
        Ib::Migration::ContractRegistry.template_generators
      end

      def source_artifact_discovery
        Ib::Migration::ContractRegistry.source_artifact_discovery
      end
    end
  end
end
