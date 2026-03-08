module Curriculum
  class ReportingEngine
    DEFAULT_RENDER_HOOKS = %w[
      web_viewer
      print_layout
      artifact_bundle
      artifact_storage
      localization
      archive
      analytics
    ].freeze

    class << self
      def contract_for(pack:)
        pack_data = stringify_keys(pack)
        {
          engine_key: "curriculum_reporting_v1",
          render_hooks: DEFAULT_RENDER_HOOKS,
          report_bindings: stringify_keys(pack_data["report_bindings"] || {}),
          template_inheritance: "pack_binding_over_shared_engine",
          archive_supported: true,
          localization_supported: true
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
