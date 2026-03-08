module Ib
  module Support
    class AnalyticsBackfillJob < ApplicationJob
      queue_as :ib_support
      retry_on StandardError, wait: 30.seconds, attempts: 2

      def perform(tenant_id, school_id = nil, actor_id = nil)
        tenant = Tenant.find(tenant_id)
        school = School.find_by(id: school_id)
        actor = User.find_by(id: actor_id)

        BenchmarkRefreshService.new(tenant: tenant, school: school, actor: actor).capture!(
          benchmark_version: "phase10.v1",
          status: "backfill",
          role_scope: "coordinator",
          workflow_family: "operations",
          metadata: {
            trigger: "phase10.analytics_backfill"
          }
        )

        AnalyticsService.new(tenant: tenant, school: school).build
      end
    end
  end
end
