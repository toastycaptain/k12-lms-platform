module Ib
  module Support
    class PilotReadinessService
      def initialize(tenant:, school: nil)
        @tenant = tenant
        @school = school
      end

      def build
        rollout = Ib::Governance::RolloutConsoleService.new(tenant: tenant, school: school).build
        review = Ib::Governance::ReviewGovernanceService.new(tenant: tenant, school: school).build
        sections = [
          section_for_pack(rollout),
          section_for_settings(rollout),
          section_for_routes(rollout),
          section_for_migration(rollout),
          section_for_review(review),
          section_for_standards,
          section_for_publishing,
          section_for_telemetry
        ]

        {
          overall_status: overall_status_for(sections),
          sections: sections,
          generated_at: Time.current.utc.iso8601
        }
      end

      private

      attr_reader :tenant, :school

      def section_for_pack(rollout)
        active_pack = rollout[:active_pack]
        status = active_pack[:using_current_pack] && rollout[:feature_flags][:healthy] ? "green" : "yellow"
        {
          key: "pack_and_flags",
          title: "Pack and flags",
          status: status,
          summary: "#{active_pack[:key]}@#{active_pack[:version]} with #{rollout[:feature_flags][:required].count { |flag| flag[:enabled] }} required flags enabled.",
          issues: rollout[:feature_flags][:required].reject { |flag| flag[:enabled] }.map { |flag| flag[:key] }
        }
      end

      def section_for_settings(rollout)
        incomplete = rollout[:programme_settings][:incomplete_programmes]
        {
          key: "programme_settings",
          title: "Programme settings",
          status: incomplete.empty? ? "green" : "yellow",
          summary: incomplete.empty? ? "Programme settings are complete." : "Missing or inherited settings remain for #{incomplete.join(', ')}.",
          issues: incomplete
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
          issues: issues
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
          ].compact
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
          issues: issues
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
          issues: issues
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
          issues: issues
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
          issues: issues
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

      def overall_status_for(sections)
        return "red" if sections.any? { |section| section[:status] == "red" }
        return "yellow" if sections.any? { |section| section[:status] == "yellow" }

        "green"
      end
    end
  end
end
