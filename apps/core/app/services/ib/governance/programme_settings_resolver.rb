module Ib
  module Governance
    class ProgrammeSettingsResolver
      PROGRAMMES = %w[Mixed PYP MYP DP].freeze
      DEFAULT_THRESHOLDS = {
        "approval_sla_days" => 5,
        "review_backlog_limit" => 12,
        "publishing_hold_hours" => 48,
        "digest_batch_limit" => 8
      }.freeze

      def initialize(tenant:, school: nil)
        @tenant = tenant
        @school = school
      end

      def resolve
        settings = scoped_settings.index_by { |setting| [ setting.school_id, setting.programme ] }

        PROGRAMMES.map do |programme|
          global = settings[[ nil, programme ]]
          school_override = school ? settings[[ school.id, programme ]] : nil
          effective = school_override || global

          {
            programme: programme,
            school_id: school&.id,
            effective: normalize_setting(effective, programme: programme),
            inherited_from: school_override ? "school" : global ? "tenant" : "defaults",
            tenant_default: normalize_setting(global, programme: programme),
            school_override: normalize_setting(school_override, programme: programme),
            complete: complete?(effective)
          }
        end
      end

      private

      attr_reader :tenant, :school

      def scoped_settings
        scope = IbProgrammeSetting.where(tenant_id: tenant.id)
        scope = scope.where(school_id: [ nil, school.id ]) if school
        scope
      end

      def normalize_setting(setting, programme:)
        metadata = setting&.metadata.is_a?(Hash) ? setting.metadata.deep_dup : {}
        {
          id: setting&.id,
          programme: programme,
          cadence_mode: setting&.cadence_mode || "weekly_digest",
          review_owner_role: setting&.review_owner_role || "curriculum_lead",
          thresholds: DEFAULT_THRESHOLDS.merge(setting&.thresholds.is_a?(Hash) ? setting.thresholds : {}),
          metadata: {
            "digest_default" => metadata["digest_default"] || "weekly_digest",
            "approval_mode" => metadata["approval_mode"] || "coordinator_review",
            "updated_by_id" => setting&.updated_by_id
          },
          updated_at: setting&.updated_at&.iso8601
        }
      end

      def complete?(setting)
        setting.present? &&
          setting.cadence_mode.present? &&
          setting.review_owner_role.present? &&
          setting.thresholds.is_a?(Hash)
      end
    end
  end
end
