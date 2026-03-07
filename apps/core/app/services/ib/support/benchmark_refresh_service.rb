module Ib
  module Support
    class BenchmarkRefreshService
      BENCHMARK_CATALOG = [
        { key: "planning", role: "teacher", label: "Plan a unit with collaboration context", click_budget: 4 },
        { key: "evidence_review", role: "teacher", label: "Process evidence to publish-ready", click_budget: 3 },
        { key: "family_publish", role: "teacher", label: "Release a family-visible update", click_budget: 3 },
        { key: "specialist_contribution", role: "specialist", label: "Contribute across classes from one screen", click_budget: 4 },
        { key: "coordinator_approval", role: "coordinator", label: "Resolve a programme exception", click_budget: 3 }
      ].freeze

      def initialize(tenant:, school: nil, actor: nil)
        @tenant = tenant
        @school = school
        @actor = actor
      end

      def index_payload
        {
          generated_at: Time.current.utc.iso8601,
          catalog: BENCHMARK_CATALOG,
          current_benchmark: WorkflowBenchmarkService.new(tenant: tenant, school: school).build,
          current_budget: PerformanceBudgetService.new(tenant: tenant, school: school).build,
          snapshots: snapshot_scope.order(captured_at: :desc, id: :desc).limit(12).map { |snapshot| serialize_snapshot(snapshot) }
        }
      end

      def capture!(attrs)
        benchmark = WorkflowBenchmarkService.new(tenant: tenant, school: school).build
        budget = PerformanceBudgetService.new(tenant: tenant, school: school).build
        snapshot = snapshot_scope.create!(
          school: school,
          captured_by: actor,
          ib_pilot_profile_id: attrs[:ib_pilot_profile_id],
          benchmark_version: attrs[:benchmark_version].presence || "phase9.v1",
          status: attrs[:status].presence || "baseline",
          role_scope: attrs[:role_scope].presence || "teacher",
          workflow_family: attrs[:workflow_family].presence || "planning",
          captured_at: Time.current,
          metrics: benchmark,
          thresholds: budget,
          metadata: normalize_hash(attrs[:metadata])
        )
        serialize_snapshot(snapshot)
      end

      private

      attr_reader :tenant, :school, :actor

      def snapshot_scope
        scope = IbBenchmarkSnapshot.where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school
        scope
      end

      def serialize_snapshot(snapshot)
        {
          id: snapshot.id,
          benchmark_version: snapshot.benchmark_version,
          status: snapshot.status,
          role_scope: snapshot.role_scope,
          workflow_family: snapshot.workflow_family,
          captured_at: snapshot.captured_at.utc.iso8601,
          metrics: snapshot.metrics,
          thresholds: snapshot.thresholds,
          metadata: snapshot.metadata
        }
      end

      def normalize_hash(value)
        value.is_a?(Hash) ? value.deep_stringify_keys : {}
      end
    end
  end
end
