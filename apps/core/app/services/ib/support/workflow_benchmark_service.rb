module Ib
  module Support
    class WorkflowBenchmarkService
      WORKFLOWS = {
        "planning" => {
          label: "Teacher planning",
          target_ms: 45_000,
          event_family: "teacher_workflow",
          surface: "teacher_studio"
        },
        "evidence_review" => {
          label: "Evidence review",
          target_ms: 30_000,
          event_family: "teacher_workflow",
          surface: "evidence_inbox"
        },
        "family_publish" => {
          label: "Family publish",
          target_ms: 35_000,
          event_family: "family_experience",
          surface: "publishing_queue"
        },
        "specialist_contribution" => {
          label: "Specialist contribution",
          target_ms: 40_000,
          event_family: "specialist_workflow",
          surface: "specialist_dashboard"
        },
        "coordinator_approval" => {
          label: "Coordinator approval",
          target_ms: 25_000,
          event_family: "coordinator_intelligence",
          surface: "operations_center"
        }
      }.freeze

      def initialize(tenant:, school: nil)
        @tenant = tenant
        @school = school
      end

      def build
        workflows = WORKFLOWS.map { |key, config| workflow_row(key, config) }

        {
          generated_at: Time.current.utc.iso8601,
          workflows: workflows,
          prioritized_backlog: prioritized_backlog(workflows)
        }
      end

      private

      attr_reader :tenant, :school

      def scope
        scoped = IbActivityEvent.where(tenant_id: tenant.id)
        scoped = scoped.where(school_id: school.id) if school
        scoped
      end

      def workflow_row(key, config)
        durations = scope.where(event_name: "ib.workflow.completed")
          .where("metadata ->> 'workflow_key' = ?", key)
          .pluck(Arel.sql("COALESCE((metadata ->> 'duration_ms')::integer, 0)"))
          .select(&:positive?)
        observed = durations.any? ? percentile_50(durations) : fallback_observed_ms(config[:target_ms])
        {
          workflow_key: key,
          label: config[:label],
          target_ms: config[:target_ms],
          observed_ms: observed,
          click_target: click_target_for(key),
          observed_clicks: observed_clicks_for(key),
          surface: config[:surface],
          status: observed <= config[:target_ms] ? "within_budget" : "over_budget"
        }
      end

      def prioritized_backlog(workflows)
        workflows
          .select { |row| row[:status] == "over_budget" }
          .sort_by { |row| -(row[:observed_ms] - row[:target_ms]) }
          .map do |row|
            {
              workflow_key: row[:workflow_key],
              impact: row[:workflow_key] == "planning" ? "high" : "medium",
              complexity: row[:workflow_key] == "family_publish" ? "medium" : "low",
              note: "Reduce steps and waiting inside #{row[:label].downcase}."
            }
          end
      end

      def percentile_50(values)
        sorted = values.sort
        sorted[sorted.length / 2]
      end

      def fallback_observed_ms(target_ms)
        (target_ms * 1.08).to_i
      end

      def click_target_for(key)
        {
          "planning" => 3,
          "evidence_review" => 2,
          "family_publish" => 2,
          "specialist_contribution" => 3,
          "coordinator_approval" => 2
        }.fetch(key, 3)
      end

      def observed_clicks_for(key)
        event = scope.where(event_name: "ib.workflow.completed")
          .where("metadata ->> 'workflow_key' = ?", key)
          .order(occurred_at: :desc)
          .first
        (event&.metadata || {}).fetch("click_count", click_target_for(key) + 1)
      end
    end
  end
end
