module Ib
  module Support
    class PilotReadinessService
      def initialize(tenant:, school: nil)
        @tenant = tenant
        @school = school
      end

      def build
        rollout = Ib::Governance::RolloutConsoleService.new(
          tenant: tenant,
          school: school,
          include_release_baseline: false
        ).build
        review = Ib::Governance::ReviewGovernanceService.new(tenant: tenant, school: school).build
        sections = [
          section_for_pack(rollout),
          section_for_release_baseline(rollout),
          section_for_setup(rollout),
          section_for_settings(rollout),
          section_for_routes(rollout),
          section_for_migration(rollout),
          section_for_review(review),
          section_for_standards,
          section_for_publishing,
          section_for_telemetry,
          section_for_analytics
        ]

        {
          overall_status: overall_status_for(sections),
          sections: sections,
          generated_at: Time.current.utc.iso8601,
          stale_after_seconds: 300
        }
      end

      private

      attr_reader :tenant, :school

      def section_for_pack(rollout)
        active_pack = rollout[:active_pack]
        baseline = rollout[:pilot_baseline] || {}
        status =
          if active_pack[:using_current_pack] && rollout[:feature_flags][:healthy] && baseline[:release_frozen]
            "green"
          else
            "yellow"
          end
        {
          key: "pack_and_flags",
          title: "Pack and flags",
          status: status,
          summary: "#{active_pack[:key]}@#{active_pack[:version]} with #{rollout[:feature_flags][:required].count { |flag| flag[:enabled] }} required flags enabled.",
          issues: rollout[:feature_flags][:required].reject { |flag| flag[:enabled] }.map { |flag| flag[:key] },
          rules: [
            rule(
              id: "pack.current_version",
              severity: active_pack[:using_current_pack] ? "info" : "blocker",
              status: active_pack[:using_current_pack] ? "pass" : "fail",
              detail: "Pilot tenants must use #{Ib::Governance::RolloutConsoleService::CURRENT_PACK_VERSION}.",
              remediation: "Reapply the pilot baseline pack.",
              href: "/ib/rollout"
            ),
            rule(
              id: "pack.release_frozen",
              severity: baseline[:release_frozen] ? "info" : "blocker",
              status: baseline[:release_frozen] ? "pass" : "fail",
              detail: "Pilot baseline release should be frozen before launch.",
              remediation: "Apply the pilot baseline bundle to freeze the current release.",
              href: "/ib/rollout"
            )
          ]
        }
      end

      def section_for_setup(rollout)
        setup = rollout[:pilot_setup] || {}
        blockers = Array(setup.dig(:steps)).flat_map { |step| Array(step[:blockers]) }
        warnings = Array(setup.dig(:steps)).flat_map { |step| Array(step[:warnings]) }
        {
          key: "pilot_setup",
          title: "Pilot setup",
          status: blockers.any? ? "red" : (warnings.any? ? "yellow" : "green"),
          summary: "School launch readiness is computed from setup steps, not inferred from hidden flags.",
          issues: blockers + warnings,
          rules: Array(setup[:steps]).map do |step|
            rule(
              id: "setup.#{step[:key]}",
              severity: step[:status] == "red" ? "blocker" : (step[:status] == "yellow" ? "warning" : "info"),
              status: step[:status] == "green" ? "pass" : "fail",
              detail: "#{step[:title]} owner: #{step[:owner]}",
              remediation: Array(step[:blockers] + step[:warnings]).first || "No action required.",
              href: step[:action_href] || "/ib/rollout"
            )
          end
        }
      end

      def section_for_release_baseline(rollout)
        baseline = rollout[:release_baseline] || {}
        blockers = Array(baseline[:blockers])
        {
          key: "release_baseline",
          title: "Release baseline",
          status: blockers.any? ? "yellow" : "green",
          summary: blockers.any? ? "GA candidate baseline still has explicit blockers." : "GA candidate baseline is machine-checked and currently clear.",
          issues: blockers.map { |item| item[:detail] || item["detail"] },
          rules: [
            rule(
              id: "release_baseline.machine_checked",
              severity: blockers.any? ? "warning" : "info",
              status: blockers.any? ? "fail" : "pass",
              detail: "Release baseline should stay verified before widening rollout bundles.",
              remediation: blockers.any? ? Array(blockers).first&.dig(:remediation) || "Open the rollout console and resolve baseline blockers." : "No action required.",
              href: "/ib/rollout"
            )
          ]
        }
      end

      def section_for_settings(rollout)
        incomplete = rollout[:programme_settings][:incomplete_programmes]
        {
          key: "programme_settings",
          title: "Programme settings",
          status: incomplete.empty? ? "green" : "yellow",
          summary: incomplete.empty? ? "Programme settings are complete." : "Missing or inherited settings remain for #{incomplete.join(', ')}.",
          issues: incomplete,
          rules: [
            rule(
              id: "settings.complete",
              severity: incomplete.empty? ? "info" : "warning",
              status: incomplete.empty? ? "pass" : "fail",
              detail: "Programme settings should be explicit before pilot launch.",
              remediation: incomplete.empty? ? "No action required." : "Complete the missing programme settings in the coordinator console.",
              href: "/ib/settings"
            )
          ]
        }
      end

      def section_for_routes(rollout)
        route_readiness = rollout[:route_readiness]
        legacy_usage = rollout[:legacy_usage]
        issues = []
        issues << "#{route_readiness[:fallback_count]} non-canonical route(s)" if route_readiness[:fallback_count].positive?
        issues << "#{legacy_usage[:legacy_document_routes]} legacy document route(s)" if legacy_usage[:legacy_document_routes].positive?
        issues << "#{legacy_usage[:demo_routes]} demo route(s)" if legacy_usage[:demo_routes].positive?

        {
          key: "route_readiness",
          title: "Route readiness",
          status: issues.empty? ? "green" : "yellow",
          summary: "#{route_readiness[:canonical_count]} of #{route_readiness[:checked_count]} sampled IB routes resolve canonically.",
          issues: issues,
          rules: [
            rule(
              id: "routes.canonical",
              severity: issues.empty? ? "info" : "warning",
              status: issues.empty? ? "pass" : "fail",
              detail: "Canonical IB routes should cover sampled documents and operational records.",
              remediation: issues.empty? ? "No action required." : "Review rollout route-readiness and legacy route counts.",
              href: "/ib/rollout"
            )
          ]
        }
      end

      def section_for_review(review)
        metrics = review[:summary_metrics]
        risk_count = metrics[:sla_breaches] + metrics[:orphaned]
        {
          key: "review_governance",
          title: "Review governance",
          status: risk_count.zero? ? "green" : "yellow",
          summary: "#{metrics[:approvals]} approvals, #{metrics[:moderation]} moderation items, #{metrics[:sla_breaches]} SLA breach risks.",
          issues: [
            ("#{metrics[:sla_breaches]} SLA breach risk(s)" if metrics[:sla_breaches].positive?),
            ("#{metrics[:orphaned]} orphaned record(s)" if metrics[:orphaned].positive?)
          ].compact,
          rules: [
            rule(
              id: "review.sla",
              severity: risk_count.zero? ? "info" : "warning",
              status: risk_count.zero? ? "pass" : "fail",
              detail: "Approval and moderation queues should stay exception-first.",
              remediation: risk_count.zero? ? "No action required." : "Open the review governance queue and resolve SLA or orphaned items.",
              href: "/ib/review"
            )
          ]
        }
      end

      def section_for_migration(rollout)
        drift = rollout[:migration_drift]
        legacy_usage = rollout[:legacy_usage]
        issues = []
        issues << "#{drift[:missing_schema_key]} document(s) missing schema keys" if drift[:missing_schema_key].positive?
        issues << "#{drift[:missing_route_hint_records]} operational record(s) missing route hints" if drift[:missing_route_hint_records].positive?
        issues << "#{legacy_usage[:legacy_document_routes]} document(s) still route through legacy plan surfaces" if legacy_usage[:legacy_document_routes].positive?
        issues << "#{legacy_usage[:legacy_operational_routes]} operational record(s) still use legacy plan routes" if legacy_usage[:legacy_operational_routes].positive?

        {
          key: "document_migration",
          title: "Document migration",
          status: issues.empty? ? "green" : "yellow",
          summary: "#{drift[:document_count]} IB document(s) tracked across #{drift[:by_pack_version].keys.compact.length} pack version bucket(s).",
          issues: issues,
          rules: [
            rule(
              id: "migration.schema_and_routes",
              severity: issues.empty? ? "info" : "warning",
              status: issues.empty? ? "pass" : "fail",
              detail: "Legacy routes and missing schema metadata must continue trending down before removal.",
              remediation: issues.empty? ? "No action required." : "Run the document consolidation audit and backfill route/schema hints.",
              href: "/ib/rollout"
            )
          ]
        }
      end

      def section_for_standards
        packets = standards_packets
        failed_exports = standards_exports.where(status: "failed").count
        issues = []
        issues << "#{packets.where.not(review_state: "approved").count} packet(s) not approved" if packets.where.not(review_state: "approved").exists?
        issues << "#{failed_exports} failed export(s)" if failed_exports.positive?

        {
          key: "standards_and_exports",
          title: "Standards and exports",
          status: issues.empty? ? "green" : "yellow",
          summary: "#{packets.count} packet(s), #{standards_exports.count} export run(s).",
          issues: issues,
          rules: [
            rule(
              id: "standards.export_health",
              severity: issues.empty? ? "info" : "warning",
              status: issues.empty? ? "pass" : "fail",
              detail: "Standards packets should be approved and exportable without failed artifact jobs.",
              remediation: issues.empty? ? "No action required." : "Replay failed exports or move pending packets through review.",
              href: "/ib/standards-practices"
            )
          ]
        }
      end

      def section_for_publishing
        queue_items = publishing_queue_items
        failed_audits = IbPublishingAudit.where(tenant_id: tenant.id, event_type: "publish_failed")
        failed_audits = failed_audits.where(school_id: school.id) if school
        issues = []
        issues << "#{queue_items.where(state: "held").count} held queue item(s)" if queue_items.where(state: "held").exists?
        issues << "#{failed_audits.count} failed publish attempt(s)" if failed_audits.exists?

        {
          key: "publishing_reliability",
          title: "Publishing reliability",
          status: issues.empty? ? "green" : "yellow",
          summary: "#{queue_items.count} queue item(s), #{queue_items.where(state: "published").count} published.",
          issues: issues,
          rules: [
            rule(
              id: "publishing.queue_health",
              severity: issues.empty? ? "info" : "warning",
              status: issues.empty? ? "pass" : "fail",
              detail: "Held queue items or failed publish attempts require human follow-up.",
              remediation: issues.empty? ? "No action required." : "Open the publishing queue or job operations console and replay/release affected items.",
              href: "/ib/families/publishing"
            )
          ]
        }
      end

      def section_for_telemetry
        failed_exports = standards_exports.where(status: "failed").count
        failed_audits = IbPublishingAudit.where(tenant_id: tenant.id, event_type: "publish_failed")
        failed_audits = failed_audits.where(school_id: school.id) if school
        issues = []
        issues << "#{failed_exports} failed export event(s)" if failed_exports.positive?
        issues << "#{failed_audits.count} failed publish event(s)" if failed_audits.exists?

        {
          key: "telemetry_signals",
          title: "Telemetry signals",
          status: issues.empty? ? "green" : "yellow",
          summary: "Route resolution, export, and publishing telemetry are emitting structured pilot signals.",
          issues: issues,
          rules: [
            rule(
              id: "telemetry.pipeline",
              severity: issues.empty? ? "info" : "warning",
              status: issues.empty? ? "pass" : "fail",
              detail: "Pilot telemetry should be healthy enough to explain route, export, and publish failures.",
              remediation: issues.empty? ? "No action required." : "Review failed export/publish telemetry and verify analytics ingest.",
              href: "/ib/readiness"
            )
          ]
        }
      end

      def section_for_analytics
        failed_exports = standards_exports.where(status: "failed").count
        blocked_imports = import_batches.where(status: %w[blocked failed]).count
        held_publishing = publishing_queue_items.where(state: "held").count
        issues = []
        issues << "#{failed_exports} failed export operation(s)" if failed_exports.positive?
        issues << "#{blocked_imports} import batch(es) blocked" if blocked_imports.positive?
        issues << "#{held_publishing} publishing item(s) held" if held_publishing.positive?
        {
          key: "analytics_and_scorecard",
          title: "Analytics and scorecard",
          status: issues.empty? ? "green" : "yellow",
          summary: "Teacher friction, coordinator operations, and queue health are visible for pilot review.",
          issues: issues,
          rules: [
            rule(
              id: "analytics.scorecard_visibility",
              severity: issues.empty? ? "info" : "warning",
              status: issues.empty? ? "pass" : "fail",
              detail: "Pilot launch should be reviewed with a visible scorecard, not only anecdotal feedback.",
              remediation: issues.empty? ? "No action required." : "Review the analytics dashboard and resolve blocked import/export queues.",
              href: "/ib/rollout"
            )
          ]
        }
      end

      def standards_packets
        scope = IbStandardsPacket.where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school
        scope
      end

      def standards_exports
        return IbStandardsExport.none unless defined?(IbStandardsExport)

        scope = IbStandardsExport.where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school
        scope
      end

      def publishing_queue_items
        scope = IbPublishingQueueItem.where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school
        scope
      end

      def import_batches
        scope = IbImportBatch.where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school
        scope
      end

      def overall_status_for(sections)
        return "red" if sections.any? { |section| section[:status] == "red" }
        return "yellow" if sections.any? { |section| section[:status] == "yellow" }

        "green"
      end

      def rule(id:, severity:, status:, detail:, remediation:, href:)
        {
          id: id,
          severity: severity,
          status: status,
          detail: detail,
          remediation: remediation,
          href: href
        }
      end
    end
  end
end
