module Curriculum
  class GovernanceConsoleRegistry
    class << self
      def contract_for(pack:)
        pack_data = stringify_keys(pack)
        {
          engine_key: "curriculum_governance_console_v1",
          consoles: [
            { key: "rollout", href: "/ib/rollout", ownership: "programme_ops" },
            { key: "readiness", href: "/ib/readiness", ownership: "programme_ops" },
            { key: "review", href: "/ib/review", ownership: "coordinator" }
          ],
          navigation_groups: stringify_keys(pack_data.dig("navigation", "admin") || {}),
          rollout_bundle_supported: true,
          readiness_rules_supported: true
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
