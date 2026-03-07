module Ib
  module Support
    class PilotSetupStatusEngine
      STEP_OWNERS = {
        "identity" => "school_admin",
        "academic_year" => "school_admin",
        "pack_and_flags" => "support",
        "programme_settings" => "coordinator",
        "planning_contexts" => "coordinator",
        "roles_and_owners" => "school_admin",
        "notifications_and_guardian_visibility" => "school_admin",
        "exports_and_jobs" => "support"
      }.freeze

      def initialize(tenant:, school:, programme: "Mixed")
        @tenant = tenant
        @school = school
        @programme = programme.presence || "Mixed"
      end

      def build
        steps = [
          identity_step,
          academic_year_step,
          pack_and_flags_step,
          programme_settings_step,
          planning_contexts_step,
          roles_and_owners_step,
          notifications_step,
          exports_step
        ]
        {
          status: overall_status_for(steps),
          programme: programme,
          school_id: school.id,
          school_name: school.name,
          summary_metrics: {
            completed_steps: steps.count { |step| step[:status] == "green" },
            total_steps: steps.length,
            blocker_count: steps.sum { |step| step[:blockers].length },
            warning_count: steps.sum { |step| step[:warnings].length }
          },
          steps: steps,
          next_actions: steps.flat_map { |step| step[:blockers].presence || step[:warnings].first(1) }.compact.first(4),
          generated_at: Time.current.utc.iso8601
        }
      end

      private

      attr_reader :tenant, :school, :programme

      def identity_step
        blockers = []
        blockers << "School scope is missing." if school.nil?
        step_payload("identity", "School identity", blockers: blockers)
      end

      def academic_year_step
        years = AcademicYear.where(tenant_id: tenant.id)
        step_payload(
          "academic_year",
          "Academic year",
          blockers: years.exists? ? [] : [ "No academic year is configured for this tenant." ],
          warnings: years.where(current: true).exists? ? [] : [ "No academic year is marked current." ],
          details: { academic_year_count: years.count, current_year_count: years.where(current: true).count },
        )
      end

      def pack_and_flags_step
        verification = PilotBaselineService.new(tenant: tenant, school: school).verify
        blockers = []
        blockers << "Pilot baseline release is not frozen." unless verification[:release_frozen]
        disabled_flags = verification[:flags].reject { |flag| flag[:enabled] }
        blockers.concat(disabled_flags.map { |flag| "Feature flag #{flag[:key]} is disabled." })
        step_payload(
          "pack_and_flags",
          "Pack and flags",
          blockers: blockers,
          details: verification,
          action_href: "/ib/rollout",
          action_label: "Apply baseline",
        )
      end

      def programme_settings_step
        resolved = Ib::Governance::ProgrammeSettingsResolver.new(tenant: tenant, school: school).resolve
        incomplete = resolved.reject { |row| row[:complete] }.map { |row| row[:programme] }
        step_payload(
          "programme_settings",
          "Programme settings",
          blockers: incomplete.empty? ? [] : [ "Incomplete settings for #{incomplete.join(', ')}." ],
          details: { incomplete_programmes: incomplete },
          action_href: "/ib/settings",
          action_label: "Open programme settings",
        )
      end

      def planning_contexts_step
        contexts = PlanningContext.where(tenant_id: tenant.id, school_id: school.id)
        blockers = []
        warnings = []
        blockers << "No planning contexts exist for the pilot school." unless contexts.exists?
        warnings << "#{contexts.where(academic_year_id: nil).count} planning context(s) are missing academic year pinning." if contexts.where(academic_year_id: nil).exists?
        step_payload(
          "planning_contexts",
          "Planning contexts",
          blockers: blockers,
          warnings: warnings,
          details: { planning_context_count: contexts.count },
        )
      end

      def roles_and_owners_step
        admin_count = role_count("admin") + role_count("district_admin")
        coordinator_count = role_count("curriculum_lead")
        teacher_count = role_count("teacher")
        blockers = []
        blockers << "No admin user is assigned to the pilot tenant." if admin_count.zero?
        blockers << "No coordinator/curriculum lead is assigned." if coordinator_count.zero?
        blockers << "No teacher is assigned for pilot workflows." if teacher_count.zero?
        step_payload(
          "roles_and_owners",
          "Roles and owners",
          blockers: blockers,
          details: { admin_count: admin_count, coordinator_count: coordinator_count, teacher_count: teacher_count },
        )
      end

      def notifications_step
        guardian_visibility = FeatureFlag.enabled?("guardian_portal_enabled", tenant: tenant)
        guardian_calm_mode = FeatureFlag.enabled?("ib_guardian_calm_mode_v1", tenant: tenant)
        preference_count = NotificationPreference.where(tenant_id: tenant.id).count
        blockers = []
        warnings = []
        blockers << "Guardian visibility is disabled." unless guardian_visibility
        warnings << "Guardian calm mode flag is disabled." unless guardian_calm_mode
        warnings << "No explicit notification preferences are stored yet." if preference_count.zero?
        step_payload(
          "notifications_and_guardian_visibility",
          "Notifications and guardian visibility",
          blockers: blockers,
          warnings: warnings,
          details: { guardian_visibility: guardian_visibility, guardian_calm_mode: guardian_calm_mode, preference_count: preference_count },
        )
      end

      def exports_step
        failed_exports = IbStandardsExport.where(tenant_id: tenant.id, school_id: school.id, status: "failed").count
        held_queue_items = IbPublishingQueueItem.where(tenant_id: tenant.id, school_id: school.id, state: "held").count
        blockers = []
        warnings = []
        blockers << "#{failed_exports} standards export(s) are failed." if failed_exports.positive?
        warnings << "#{held_queue_items} publishing queue item(s) are held." if held_queue_items.positive?
        step_payload(
          "exports_and_jobs",
          "Exports and jobs",
          blockers: blockers,
          warnings: warnings,
          details: { failed_exports: failed_exports, held_queue_items: held_queue_items },
          action_href: "/ib/rollout",
          action_label: "Open operations",
        )
      end

      def step_payload(key, title, blockers: [], warnings: [], details: {}, action_href: nil, action_label: nil)
        {
          key: key,
          title: title,
          owner: STEP_OWNERS.fetch(key),
          status: status_for(blockers: blockers, warnings: warnings),
          blockers: blockers,
          warnings: warnings,
          details: details,
          action_href: action_href,
          action_label: action_label
        }
      end

      def status_for(blockers:, warnings:)
        return "red" if blockers.any?
        return "yellow" if warnings.any?

        "green"
      end

      def overall_status_for(steps)
        return "retired" if false
        return "blocked" if steps.any? { |step| step[:status] == "red" }
        return "in_progress" if steps.any? { |step| step[:status] == "yellow" }

        "ready_for_pilot"
      end

      def role_count(role_name)
        User.unscoped.joins(:roles).where(tenant_id: tenant.id, roles: { name: role_name }).distinct.count
      end
    end
  end
end
