module Ib
  module Support
    class PerformanceBudgetService
      def initialize(tenant:, school: nil)
        @tenant = tenant
        @school = school
      end

      def build
        benchmark = WorkflowBenchmarkService.new(tenant: tenant, school: school).build
        {
          generated_at: Time.current.utc.iso8601,
          budgets: benchmark[:workflows].map do |workflow|
            {
              workflow_key: workflow[:workflow_key],
              label: workflow[:label],
              target_ms: workflow[:target_ms],
              observed_ms: workflow[:observed_ms],
              regression_ms: [ workflow[:observed_ms] - workflow[:target_ms], 0 ].max,
              status: workflow[:status]
            }
          end,
          regressions: benchmark[:prioritized_backlog]
        }
      end

      private

      attr_reader :tenant, :school
    end
  end
end
