module Ib
  module Readiness
    class ReplacementReadinessService
      def initialize(tenant:, school: nil, actor: nil)
        @tenant = tenant
        @school = school
        @actor = actor
      end

      def build
        summary = readiness_summary
        gaps = unresolved_gaps(summary)
        pilot_goal_checks = pilot_goal_checks(summary)
        tracks = track_summaries(summary: summary, gaps: gaps, pilot_goal_checks: pilot_goal_checks)
        {
          generated_at: Time.current.utc.iso8601,
          summary: summary,
          pilot_goal_checks: pilot_goal_checks,
          tracks: tracks,
          gaps: gaps,
          next_step: recommended_next_step(summary, gaps),
          export_payload: {
            pilot_profiles: IbPilotProfile.where(tenant_id: tenant.id).yield_self { |scope| school ? scope.where(school_id: school.id) : scope }.count,
            migration_sessions: IbMigrationSession.where(tenant_id: tenant.id).yield_self { |scope| school ? scope.where(school_id: school.id) : scope }.count,
            report_cycles: IbReportCycle.where(tenant_id: tenant.id).yield_self { |scope| school ? scope.where(school_id: school.id) : scope }.count,
            open_collaboration_tasks: count_for(IbCollaborationTask, status: %w[open in_progress blocked]),
            benchmark_regressions: over_budget_workflows
          }
        }
      end

      def generate!
        payload = build
        snapshot = snapshot_scope.create!(
          school: school,
          captured_by: actor,
          ib_pilot_profile_id: latest_pilot_profile_id,
          status: overall_status(payload[:summary]),
          generated_at: Time.current,
          readiness_summary: payload[:summary],
          gap_summary: {
            "items" => payload[:gaps],
            "tracks" => payload[:tracks],
            "pilot_goal_checks" => payload[:pilot_goal_checks],
            "next_step" => payload[:next_step]
          },
          export_payload: payload[:export_payload],
          metadata: { "phase" => "phase9" }
        )
        serialize_snapshot(snapshot)
      end

      private

      attr_reader :tenant, :school, :actor

      def snapshot_scope
        scope = IbReplacementReadinessSnapshot.where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school
        scope
      end

      def readiness_summary
        {
          adoption: { status: status_for(count_for(IbPilotProfile), 1), count: count_for(IbPilotProfile) },
          migration: { status: status_for(count_for(IbMigrationSession, cutover_state: "cutover_ready"), 1), ready_sessions: count_for(IbMigrationSession, cutover_state: "cutover_ready") },
          reporting: { status: status_for(count_for(IbReportCycle, status: [ "approved", "scheduled", "delivered" ]), 1), active_cycles: count_for(IbReportCycle) },
          collaboration: { status: status_for(count_for(IbCollaborationTask, status: [ "open", "in_progress" ]), 1, invert: true), open_tasks: count_for(IbCollaborationTask, status: [ "open", "in_progress" ]) },
          speed: { status: status_for(over_budget_workflows, 1, invert: true), regressions: over_budget_workflows },
          intelligence: { status: status_for(count_for(IbIntelligenceMetricDefinition), 3), definitions: count_for(IbIntelligenceMetricDefinition) },
          trust: { status: status_for(count_for(IbTrustPolicy), 2), policies: count_for(IbTrustPolicy) },
          mobile: { status: status_for(count_for(IbMobileSyncDiagnostic, status: [ "degraded", "failed", "conflicted" ]), 1, invert: true), degraded_workflows: count_for(IbMobileSyncDiagnostic, status: [ "degraded", "failed", "conflicted" ]) },
          search: { status: status_for(count_for(IbSearchProfile), 1), profiles: count_for(IbSearchProfile) }
        }
      end

      def unresolved_gaps(summary)
        summary.filter_map do |key, value|
          next if value[:status] == "green"

          {
            key: key.to_s,
            status: value[:status],
            detail: value.except(:status)
          }
        end
      end

      def pilot_goal_checks(summary)
        profile = latest_pilot_profile
        role_success_metrics = profile&.role_success_metrics || {}
        metrics = role_success_metrics.presence || default_goal_catalog

        metrics.map do |key, config|
          {
            key: key.to_s,
            label: config["label"] || config[:label] || key.to_s.humanize,
            role: config["role"] || config[:role] || inferred_role_for_goal(key),
            target: config["target"] || config[:target] || "Tracked",
            observed: observed_value_for_goal(key),
            status: status_for_goal(key, summary)
          }
        end
      end

      def track_summaries(summary:, gaps:, pilot_goal_checks:)
        grouped_goals = pilot_goal_checks.group_by { |row| row[:role] }

        [
          track_row(
            key: "adoption",
            title: "Real-school adoption phase",
            status: summary.fetch(:adoption).fetch(:status),
            href: "/ib/rollout",
            detail: "#{summary.dig(:adoption, :count)} pilot profile(s), #{grouped_goals.fetch("teacher", []).length} teacher-focused success metric(s)."
          ),
          track_row(
            key: "migration",
            title: "Migration moat",
            status: summary.fetch(:migration).fetch(:status),
            href: "/ib/rollout",
            detail: "#{summary.dig(:migration, :ready_sessions)} migration session(s) are cutover-ready."
          ),
          track_row(
            key: "reporting",
            title: "Reporting command center",
            status: summary.fetch(:reporting).fetch(:status),
            href: "/ib/reports",
            detail: "#{summary.dig(:reporting, :active_cycles)} active report cycle(s) are visible in the reporting track."
          ),
          track_row(
            key: "collaboration",
            title: "Collaboration upgrade",
            status: summary.fetch(:collaboration).fetch(:status),
            href: "/ib/review",
            detail: "#{summary.dig(:collaboration, :open_tasks)} open collaboration task(s) remain."
          ),
          track_row(
            key: "speed",
            title: "Teacher and specialist speed sprint",
            status: summary.fetch(:speed).fetch(:status),
            href: "/ib/home",
            detail: "#{summary.dig(:speed, :regressions)} workflow regression(s) are still over budget."
          ),
          track_row(
            key: "intelligence",
            title: "Coordinator decision support",
            status: summary.fetch(:intelligence).fetch(:status),
            href: "/ib/operations",
            detail: "#{summary.dig(:intelligence, :definitions)} intelligence definition(s) are active."
          ),
          track_row(
            key: "trust",
            title: "Family and student trust layer",
            status: summary.fetch(:trust).fetch(:status),
            href: "/ib/guardian/home",
            detail: "#{summary.dig(:trust, :policies)} trust policy record(s) are configured."
          ),
          track_row(
            key: "mobile",
            title: "Mobile and offline trust",
            status: summary.fetch(:mobile).fetch(:status),
            href: "/ib/specialist",
            detail: "#{summary.dig(:mobile, :degraded_workflows)} degraded mobile workflow(s) are currently tracked."
          ),
          track_row(
            key: "search",
            title: "Search, performance, and job reliability",
            status: summary.fetch(:search).fetch(:status),
            href: "/ib/home",
            detail: "#{summary.dig(:search, :profiles)} search profile(s) are configured for large-school operations."
          )
        ].map do |track|
          related_gap = gaps.find { |gap| gap[:key] == track[:key] }
          track.merge(
            gap: related_gap,
            follow_up: follow_up_for(track[:key], related_gap)
          )
        end
      end

      def track_row(key:, title:, status:, href:, detail:)
        {
          key: key,
          title: title,
          status: status,
          href: href,
          detail: detail
        }
      end

      def serialize_snapshot(snapshot)
        {
          id: snapshot.id,
          status: snapshot.status,
          generated_at: snapshot.generated_at.utc.iso8601,
          readiness_summary: snapshot.readiness_summary,
          gap_summary: snapshot.gap_summary,
          export_payload: snapshot.export_payload,
          updated_at: snapshot.updated_at.utc.iso8601
        }
      end

      def overall_status(summary)
        statuses = summary.values.map { |row| row[:status] }
        return "red" if statuses.include?("red")
        return "yellow" if statuses.include?("yellow")

        "green"
      end

      def status_for(value, threshold, invert: false)
        return invert ? "yellow" : "red" if value.nil?
        invert ? (value.to_i.zero? ? "green" : "yellow") : (value.to_i >= threshold ? "green" : "yellow")
      end

      def over_budget_workflows
        benchmark = ::Ib::Support::PerformanceBudgetService.new(tenant: tenant, school: school).build
        Array(benchmark[:regressions]).length
      end

      def latest_pilot_profile_id
        latest_pilot_profile&.id
      end

      def latest_pilot_profile
        scope = IbPilotProfile.where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school
        scope.order(updated_at: :desc, id: :desc).first
      end

      def default_goal_catalog
        {
          "time_to_first_unit" => { "label" => "Time to first unit", "role" => "teacher", "target" => "<= 2 school days" },
          "time_to_first_report" => { "label" => "Time to first report", "role" => "coordinator", "target" => "<= 10 school days" },
          "evidence_processing_latency" => { "label" => "Evidence processing latency", "role" => "teacher", "target" => "<= 24 hours" },
          "specialist_contribution_latency" => { "label" => "Specialist contribution latency", "role" => "specialist", "target" => "<= 1 school day" },
          "family_read_rate" => { "label" => "Family read rate", "role" => "guardian", "target" => ">= 70%" },
          "student_reflection_completion" => { "label" => "Student reflection completion", "role" => "student", "target" => ">= 60%" }
        }
      end

      def inferred_role_for_goal(key)
        default_goal_catalog.fetch(key.to_s, {}).fetch("role", "teacher")
      end

      def observed_value_for_goal(key)
        case key.to_s
        when "time_to_first_unit"
          "#{count_for(CurriculumDocument)} document(s) live"
        when "time_to_first_report"
          "#{count_for(IbReportCycle)} cycle(s) live"
        when "evidence_processing_latency"
          "#{count_for(IbEvidenceItem, status: %w[needs_validation held_internal])} evidence item(s) still pending"
        when "specialist_contribution_latency"
          "#{count_for(IbCollaborationTask, priority: %w[high urgent])} high-priority collaboration task(s)"
        when "family_read_rate"
          "#{family_read_rate}% read or acknowledged"
        when "student_reflection_completion"
          "#{count_for(IbReflectionRequest, status: "responded")} responded reflection request(s)"
        else
          "Tracked in Phase 9"
        end
      end

      def status_for_goal(key, summary)
        case key.to_s
        when "family_read_rate"
          family_read_rate >= 70 ? "green" : "yellow"
        when "student_reflection_completion"
          count_for(IbReflectionRequest, status: "responded").positive? ? "green" : "yellow"
        when "specialist_contribution_latency"
          summary.dig(:collaboration, :status)
        when "time_to_first_report"
          summary.dig(:reporting, :status)
        when "time_to_first_unit", "evidence_processing_latency"
          summary.dig(:adoption, :status)
        else
          "yellow"
        end
      end

      def family_read_rate
        receipts = IbDeliveryReceipt.where(tenant_id: tenant.id)
        receipts = receipts.where(school_id: school.id) if school
        total = receipts.count
        return 0.0 if total.zero?

        ((receipts.where(state: %w[read acknowledged]).count.to_f / total) * 100).round(1)
      end

      def recommended_next_step(summary, gaps)
        return "stabilization" if summary.values.any? { |row| row[:status] == "red" }
        return "pilot_scale_up" if gaps.empty?

        "selective_ga_after_gap_closure"
      end

      def follow_up_for(key, gap)
        return "Track is currently green." unless gap

        case key
        when "migration"
          "Resolve remaining cutover blockers before pilot go-live."
        when "speed"
          "Clear benchmark regressions before widening rollout."
        when "mobile"
          "Investigate degraded mobile workflows and confirm sync recovery."
        else
          "Address the linked gap before declaring this track replacement-ready."
        end
      end

      def count_for(model, conditions = {})
        scope = model.where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school && model.column_names.include?("school_id")
        conditions.each do |key, value|
          scope = scope.where(key => value)
        end
        scope.count
      rescue StandardError
        0
      end
    end
  end
end
