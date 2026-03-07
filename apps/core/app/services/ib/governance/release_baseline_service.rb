module Ib
  module Governance
    class ReleaseBaselineService
      RELEASE_CHANNEL = "ib-ga-candidate".freeze

      def initialize(tenant:, school: nil, actor: nil)
        @tenant = tenant
        @school = school
        @actor = actor
      end

      def build
        baseline = ensure_baseline!
        rollout = RolloutConsoleService.new(
          tenant: tenant,
          school: school,
          include_release_baseline: false
        ).build
        readiness = ::Ib::Support::PilotReadinessService.new(tenant: tenant, school: school).build
        flag_catalog = FlagCatalogService.new(tenant: tenant)
        checklist = evaluate_checklist(rollout: rollout, readiness: readiness, flag_catalog: flag_catalog)

        baseline.update!(
          ci_status: checklist[:ci_matrix][:status],
          migration_status: checklist[:migration_rehearsal][:status],
          checklist: checklist.transform_values { |entry| entry.except(:label) },
          flag_snapshot: {
            "required_flags" => FeatureFlag.ib_phase8_snapshot(tenant: tenant),
            "inventory" => flag_catalog.inventory
          },
          dependency_snapshot: {
            "bundles" => flag_catalog.bundles,
            "kill_switches" => flag_catalog.kill_switches
          },
          metadata: baseline.metadata.merge(
            "generated_at" => Time.current.utc.iso8601,
            "school_id" => school&.id
          )
        )

        serialize(baseline.reload, checklist: checklist, rollout: rollout, readiness: readiness)
      end

      def verify!
        payload = build
        baseline = ensure_baseline!
        baseline.update!(
          status: payload[:blockers].empty? ? "verified" : "failed",
          verified_at: Time.current
        )
        serialize(baseline.reload, checklist: payload[:checklist], rollout: payload[:rollout], readiness: payload[:readiness])
      end

      def certify!
        payload = verify!
        raise ArgumentError, "Release baseline still has blockers" if payload[:blockers].any?
        raise ArgumentError, "actor is required" if actor.nil?

        baseline = ensure_baseline!
        baseline.update!(status: "certified", certified_by: actor, certified_at: Time.current)
        serialize(baseline.reload, checklist: payload[:checklist], rollout: payload[:rollout], readiness: payload[:readiness])
      end

      def rollback!
        baseline = ensure_baseline!
        baseline.update!(status: "rolled_back", rolled_back_at: Time.current)
        serialize(baseline, checklist: baseline.checklist, rollout: {}, readiness: {})
      end

      private

      attr_reader :tenant, :school, :actor

      def ensure_baseline!
        IbReleaseBaseline.find_or_initialize_by(
          tenant: tenant,
          school: school,
          release_channel: RELEASE_CHANNEL
        ).tap do |baseline|
          baseline.pack_key ||= RolloutConsoleService::PACK_KEY
          baseline.pack_version ||= RolloutConsoleService::CURRENT_PACK_VERSION
          baseline.created_by ||= actor
          baseline.save! if baseline.new_record?
        end
      end

      def evaluate_checklist(rollout:, readiness:, flag_catalog:)
        {
          pack_version: check_entry(
            label: "Pack version and route parity",
            status: rollout.dig(:active_pack, :using_current_pack) && rollout.dig(:route_readiness, :healthy) ? "pass" : "fail",
            detail: "#{rollout.dig(:active_pack, :key)}@#{rollout.dig(:active_pack, :version)} with #{rollout.dig(:route_readiness, :fallback_count)} fallback route(s).",
            remediation: "Resolve pack drift or canonical route fallbacks in the rollout console."
          ),
          ci_matrix: check_entry(
            label: "CI matrix and export hygiene",
            status: ci_matrix_ready? ? "pass" : "fail",
            detail: "Phase 8 release scripts and manifests are #{ci_matrix_ready? ? 'present' : 'missing'} in the repo.",
            remediation: "Restore the Phase 8 release-gate scripts or update the release manifest."
          ),
          migration_rehearsal: check_entry(
            label: "Migration rehearsal",
            status: migration_ready?(rollout) ? "pass" : "fail",
            detail: "#{rollout.dig(:migration_drift, :document_count)} document(s) tracked with #{rollout.dig(:migration_drift, :missing_schema_key)} missing schema key(s).",
            remediation: "Run the migration preview and resolve missing schema keys or route hints."
          ),
          feature_bundles: check_entry(
            label: "Feature bundles",
            status: flag_catalog.bundle_payload("ga_candidate")[:complete] ? "pass" : "fail",
            detail: "#{flag_catalog.bundle_payload('ga_candidate')[:enabled_count]} / #{FeatureFlag::IB_PHASE8_REQUIRED_FLAGS.length} required flags enabled.",
            remediation: "Enable the GA candidate bundle or use kill switches to narrow rollout scope."
          ),
          readiness: check_entry(
            label: "Pilot readiness",
            status: readiness[:overall_status] == "red" ? "fail" : "pass",
            detail: "Readiness overall status is #{readiness[:overall_status]}.",
            remediation: "Resolve blocked readiness sections before certifying GA candidate."
          )
        }
      end

      def serialize(baseline, checklist:, rollout:, readiness:)
        blockers = Array(checklist).filter_map do |key, value|
          next unless value[:status] == "fail"
          { key: key.to_s, detail: value[:detail], remediation: value[:remediation] }
        end

        {
          id: baseline.id,
          release_channel: baseline.release_channel,
          status: baseline.status,
          pack_key: baseline.pack_key,
          pack_version: baseline.pack_version,
          ci_status: baseline.ci_status,
          migration_status: baseline.migration_status,
          checklist: checklist,
          blockers: blockers,
          verified_at: baseline.verified_at&.utc&.iso8601,
          certified_at: baseline.certified_at&.utc&.iso8601,
          rolled_back_at: baseline.rolled_back_at&.utc&.iso8601,
          rollout: rollout,
          readiness: readiness,
          generated_at: Time.current.utc.iso8601
        }
      end

      def check_entry(label:, status:, detail:, remediation:)
        {
          label: label,
          status: status,
          detail: detail,
          remediation: remediation
        }
      end

      def ci_matrix_ready?
        root = Rails.root.join("..", "..")
        %w[
          .github/workflows/ci.yml
          .github/workflows/deploy.yml
          scripts/ib_pilot_release_gate.sh
          scripts/ib_repo_integrity.sh
          scripts/ib_archive_verify.sh
        ].all? { |path| File.exist?(root.join(path)) }
      end

      def migration_ready?(rollout)
        rollout.dig(:migration_drift, :missing_schema_key).to_i.zero? &&
          rollout.dig(:migration_drift, :missing_route_hint_records).to_i.zero?
      end
    end
  end
end
