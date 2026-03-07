module Ib
  module Support
    class PilotBaselineService
      PACK_KEY = Ib::Governance::RolloutConsoleService::PACK_KEY
      PACK_VERSION = Ib::Governance::RolloutConsoleService::CURRENT_PACK_VERSION
      RELEASE_CHANNEL = "ib-pilot".freeze

      def initialize(tenant:, school: nil, actor: nil)
        @tenant = tenant
        @school = school
        @actor = actor
      end

      def bundle_definition
        {
          pack_key: PACK_KEY,
          pack_version: PACK_VERSION,
          release_channel: RELEASE_CHANNEL,
          flags: FeatureFlag.ib_phase6_snapshot(tenant: tenant).keys
        }
      end

      def apply!
        raise ArgumentError, "actor is required" if actor.nil?

        release = ensure_release!
        FeatureFlag.ib_phase6_snapshot(tenant: tenant).keys.each do |flag_key|
          FeatureFlag.find_or_initialize_by(tenant: tenant, key: flag_key).tap do |flag|
            flag.enabled = true
            flag.save!
          end
        end

        settings = tenant.settings.is_a?(Hash) ? tenant.settings.deep_dup : {}
        settings["ib_pilot_baseline"] = {
          "pack_key" => PACK_KEY,
          "pack_version" => PACK_VERSION,
          "release_channel" => RELEASE_CHANNEL,
          "release_id" => release.id,
          "applied_at" => Time.current.utc.iso8601,
          "applied_by_id" => actor.id,
          "school_id" => school&.id
        }
        tenant.update!(settings: settings)

        verify
      end

      def verify
        baseline_settings = tenant.settings.is_a?(Hash) ? tenant.settings.fetch("ib_pilot_baseline", {}) : {}
        release = CurriculumProfileRelease.unscoped.find_by(
          tenant_id: tenant.id,
          profile_key: PACK_KEY,
          profile_version: PACK_VERSION,
        )
        flags = FeatureFlag.ib_phase6_snapshot(tenant: tenant)
        {
          pack_key: PACK_KEY,
          pack_version: PACK_VERSION,
          release_channel: RELEASE_CHANNEL,
          release_status: release&.status,
          release_frozen: release&.status == "frozen",
          baseline_applied: baseline_settings.present?,
          baseline_settings: baseline_settings,
          flags: flags.map { |key, enabled| { key: key, enabled: enabled } },
          healthy: release&.status == "frozen" && flags.values.all?
        }
      end

      private

      attr_reader :tenant, :school, :actor

      def ensure_release!
        release = CurriculumProfileRelease.unscoped.find_by(
          tenant_id: tenant.id,
          profile_key: PACK_KEY,
          profile_version: PACK_VERSION,
        )
        return freeze_release!(release) if release.present?

        payload = CurriculumProfileRegistry.find(PACK_KEY, PACK_VERSION)
        raise ArgumentError, "Pilot baseline pack #{PACK_KEY}@#{PACK_VERSION} not found" if payload.blank?

        lifecycle = CurriculumProfileLifecycleService.new(tenant: tenant, actor: actor)
        lifecycle.import!(payload: payload, metadata: { "release_channel" => RELEASE_CHANNEL })
        lifecycle.publish!(profile_key: PACK_KEY, profile_version: PACK_VERSION, metadata: { "release_channel" => RELEASE_CHANNEL })
        release = CurriculumProfileRelease.unscoped.find_by!(tenant_id: tenant.id, profile_key: PACK_KEY, profile_version: PACK_VERSION)
        freeze_release!(release)
      end

      def freeze_release!(release)
        return release if release.status == "frozen"

        lifecycle = CurriculumProfileLifecycleService.new(tenant: tenant, actor: actor)
        lifecycle.publish!(profile_key: PACK_KEY, profile_version: PACK_VERSION, metadata: { "release_channel" => RELEASE_CHANNEL }) unless release.status == "published"
        lifecycle.freeze!(profile_key: PACK_KEY, profile_version: PACK_VERSION, metadata: { "release_channel" => RELEASE_CHANNEL })
      end
    end
  end
end
