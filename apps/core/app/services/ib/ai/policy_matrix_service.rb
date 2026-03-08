module Ib
  module Ai
    class PolicyMatrixService
      def initialize(user:, school: nil)
        @user = user
        @school = school
      end

      def build
        active_provider = AiProviderConfig.find_by(tenant_id: user.tenant_id, status: "active")
        enabled_policies = AiTaskPolicy.where(tenant_id: user.tenant_id, enabled: true, task_type: TaskCatalog.keys)
                                       .index_by(&:task_type)
        adoption = AdoptionService.new(tenant: user.tenant, school: school).build
        tenant_controls = GuardrailService.default_tenant_controls.merge(tenant_control_overrides)
        tasks = TaskCatalog.tasks.map do |task_type, definition|
          policy = enabled_policies[task_type]
          allowed_roles = Array(policy&.allowed_roles).presence || Array(definition[:default_roles])
          by_task = adoption[:by_task][task_type] || {}
          available = active_provider.present? && policy.present? && role_allowed?(allowed_roles)

          {
            task_type: task_type,
            label: definition[:label],
            workflow: definition[:workflow],
            output_mode: definition[:output_mode],
            available: available,
            provider_ready: active_provider.present?,
            policy_ready: policy.present?,
            review_required: definition[:review_required],
            allowed_roles: allowed_roles,
            human_only_boundaries: Array(definition[:human_only_boundaries]),
            invocation_count: by_task[:invocation_count].to_i,
            applied_count: by_task[:applied_count].to_i,
            average_trust: by_task[:average_trust].to_f
          }
        end.sort_by { |task| [ task[:workflow].to_s, task[:label].to_s ] }

        {
          provider_ready: active_provider.present?,
          available_count: tasks.count { |task| task[:available] },
          review_required_count: tasks.count { |task| task[:review_required] },
          trust_average: adoption[:average_trust],
          estimated_minutes_saved: adoption[:estimated_minutes_saved],
          tasks: tasks,
          benchmarks: QualityService.benchmarks,
          red_team_scenarios: QualityService.red_team_scenarios,
          tenant_controls: tenant_controls
        }
      end

      private

      attr_reader :user, :school

      def tenant_control_overrides
        return {} unless user.tenant&.settings.is_a?(Hash)

        controls = user.tenant.settings.fetch("ib_ai_assist", {})
        controls.respond_to?(:to_h) ? controls.to_h : {}
      end

      def role_allowed?(allowed_roles)
        return true if allowed_roles.blank?

        (allowed_roles.map(&:to_s) & user.roles.pluck(:name)).any?
      end
    end
  end
end
