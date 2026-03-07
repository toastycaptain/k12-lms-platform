module Ib
  module Support
    class PilotSetupMutationService
      def initialize(tenant:, school:, actor:, programme: "Mixed")
        @tenant = tenant
        @school = school
        @actor = actor
        @programme = programme.presence || "Mixed"
      end

      def show
        serialize(current_setup)
      end

      def setup_record
        current_setup
      end

      def upsert!(attributes)
        setup = current_setup
        setup.assign_attributes(
          feature_flag_bundle: setup.feature_flag_bundle.merge(normalize_hash(attributes[:feature_flag_bundle])),
          owner_assignments: setup.owner_assignments.merge(normalize_hash(attributes[:owner_assignments])),
          status_details: setup.status_details.merge(normalize_hash(attributes[:status_details])),
          created_by: setup.created_by || actor,
          updated_by: actor,
        )
        setup.status = "in_progress" if setup.status == "not_started"
        setup.save!
        validate!
      end

      def apply_baseline!
        baseline = PilotBaselineService.new(tenant: tenant, school: school, actor: actor).apply!
        setup = current_setup
        setup.feature_flag_bundle = {
          "pack_key" => baseline[:pack_key],
          "pack_version" => baseline[:pack_version],
          "flags" => baseline[:flags]
        }
        setup.baseline_metadata = baseline[:baseline_settings] || {}
        setup.status = "in_progress" if setup.status == "not_started"
        setup.created_by ||= actor
        setup.updated_by = actor
        setup.save!
        validate!
      end

      def validate!
        setup = current_setup
        payload = Ib::Support::PilotSetupStatusEngine.new(tenant: tenant, school: school, programme: programme).build
        setup.setup_steps = payload[:steps].index_by { |step| step[:key] }
        setup.status = derive_status(payload)
        setup.last_validated_at = Time.current
        setup.created_by ||= actor
        setup.updated_by = actor
        setup.save!
        serialize(setup, payload: payload)
      end

      def activate!
        payload = validate!
        raise ActiveRecord::RecordInvalid.new(current_setup), "Pilot setup is blocked" if payload[:status] == "blocked"

        current_setup.update!(status: "active", activated_at: Time.current, updated_by: actor)
        serialize(current_setup)
      end

      def pause!(reason: nil)
        current_setup.update!(status: "paused", paused_reason: reason, paused_at: Time.current, updated_by: actor)
        serialize(current_setup)
      end

      def resume!
        current_setup.update!(status: "in_progress", paused_reason: nil, updated_by: actor)
        validate!
      end

      def retire!
        current_setup.update!(status: "retired", retired_at: Time.current, updated_by: actor)
        serialize(current_setup)
      end

      private

      attr_reader :tenant, :school, :actor, :programme

      def current_setup
        @current_setup ||= IbPilotSetup.find_or_initialize_by(tenant: tenant, school: school, programme: programme)
      end

      def derive_status(payload)
        case payload[:status]
        when "ready_for_pilot"
          "ready_for_pilot"
        when "blocked"
          "blocked"
        else
          "in_progress"
        end
      end

      def serialize(setup, payload: nil)
        engine_payload = payload || Ib::Support::PilotSetupStatusEngine.new(tenant: tenant, school: school, programme: programme).build
        {
          id: setup.id,
          programme: setup.programme,
          status: setup.status,
          feature_flag_bundle: setup.feature_flag_bundle,
          owner_assignments: setup.owner_assignments,
          status_details: setup.status_details,
          paused_reason: setup.paused_reason,
          last_validated_at: setup.last_validated_at&.utc&.iso8601,
          activated_at: setup.activated_at&.utc&.iso8601,
          generated_at: engine_payload[:generated_at],
          summary_metrics: engine_payload[:summary_metrics],
          steps: engine_payload[:steps],
          next_actions: engine_payload[:next_actions],
          computed_status: engine_payload[:status]
        }
      end

      def normalize_hash(value)
        return {} if value.blank?
        return value.to_unsafe_h.stringify_keys if value.respond_to?(:to_unsafe_h)
        return value.to_h.stringify_keys if value.respond_to?(:to_h)

        {}
      end
    end
  end
end
