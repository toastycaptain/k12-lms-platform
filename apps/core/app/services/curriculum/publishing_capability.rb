module Curriculum
  class PublishingCapability
    class << self
      def contract_for(pack:)
        pack_data = stringify_keys(pack)
        {
          engine_key: "curriculum_publishing_v1",
          supports_evidence_capture: true,
          supports_story_composition: capability_enabled?(pack_data, "portfolio"),
          supports_family_delivery: true,
          moderation_required: true,
          capability_modules: stringify_keys(pack_data["capability_modules"] || {})
        }
      end

      private

      def capability_enabled?(pack_data, key)
        pack_data.fetch("capability_modules", {}).key?(key)
      end

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
