module Ib
  module Ai
    class AdoptionService
      WINDOW = 30.days

      def initialize(tenant:, school: nil)
        @tenant = tenant
        @school = school
      end

      def build
        invocations = scoped_invocations
        reviewed = invocations.count { |invocation| review_payload(invocation).present? }
        applied = invocations.count { |invocation| invocation.context.dig("apply", "applied_at").present? }
        trust_values = invocations.filter_map { |invocation| review_payload(invocation)&.dig("teacher_trust")&.to_f }
        minutes_saved = invocations.sum { |invocation| review_payload(invocation)&.dig("estimated_minutes_saved").to_i }

        {
          total_invocations: invocations.length,
          reviewed_count: reviewed,
          applied_count: applied,
          review_rate: percentage(reviewed, invocations.length),
          apply_rate: percentage(applied, invocations.length),
          average_trust: trust_values.empty? ? 0.0 : (trust_values.sum / trust_values.length).round(2),
          estimated_minutes_saved: minutes_saved,
          by_task: TaskCatalog.keys.index_with do |task_type|
            task_invocations = invocations.select { |invocation| invocation.task_type == task_type }
            {
              invocation_count: task_invocations.length,
              applied_count: task_invocations.count { |invocation| invocation.context.dig("apply", "applied_at").present? },
              average_trust: average_trust_for(task_invocations)
            }
          end
        }
      end

      private

      attr_reader :tenant, :school

      def scoped_invocations
        scope = AiInvocation.where(tenant_id: tenant.id, task_type: TaskCatalog.keys)
        scope = scope.where("created_at >= ?", WINDOW.ago)
        scope = scope.where("context ->> 'school_id' = ?", school.id.to_s) if school
        scope.order(created_at: :desc).to_a
      end

      def review_payload(invocation)
        payload = invocation.context["review"] || invocation.context[:review]
        return unless payload.respond_to?(:to_h)

        payload.to_h.with_indifferent_access
      end

      def average_trust_for(invocations)
        values = invocations.filter_map { |invocation| review_payload(invocation)&.dig("teacher_trust")&.to_f }
        return 0.0 if values.empty?

        (values.sum / values.length).round(2)
      end

      def percentage(numerator, denominator)
        return 0.0 if denominator.zero?

        ((numerator.to_f / denominator) * 100).round(1)
      end
    end
  end
end
