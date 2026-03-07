module Ib
  module Pilot
    class ProgrammeService
      ARCHETYPES = [
        {
          key: "small_pyp",
          label: "Small PYP-only",
          detail: "One-campus PYP school focused on quick onboarding and family clarity."
        },
        {
          key: "continuum",
          label: "Continuum",
          detail: "Full PYP/MYP/DP school with coordinator intelligence and reporting depth."
        },
        {
          key: "dp_heavy",
          label: "DP-heavy",
          detail: "Large DP programme with registrar, IA, and core-reporting pressure."
        },
        {
          key: "specialist_heavy",
          label: "Specialist-heavy",
          detail: "School with high cross-grade specialist contribution and mobile capture demand."
        }
      ].freeze

      METRIC_DEFINITIONS = [
        { key: "time_to_first_unit", label: "Time to first unit", role: "teacher", target: "<= 2 school days" },
        { key: "time_to_first_report", label: "Time to first report", role: "coordinator", target: "<= 10 school days" },
        { key: "evidence_processing_latency", label: "Evidence processing latency", role: "teacher", target: "<= 24 hours" },
        { key: "specialist_contribution_latency", label: "Specialist contribution latency", role: "specialist", target: "<= 1 school day" },
        { key: "family_read_rate", label: "Family read rate", role: "guardian", target: ">= 70%" },
        { key: "student_reflection_completion", label: "Student reflection completion", role: "student", target: ">= 60%" }
      ].freeze

      def initialize(tenant:, school: nil, actor: nil)
        @tenant = tenant
        @school = school
        @actor = actor
      end

      def index_payload
        {
          generated_at: Time.current.utc.iso8601,
          archetypes: ARCHETYPES,
          metric_definitions: METRIC_DEFINITIONS,
          profiles: scoped_profiles.includes(:baseline_snapshots).order(updated_at: :desc).map { |profile| serialize_profile(profile) }
        }
      end

      def upsert_profile!(attrs)
        profile = attrs[:id].present? ? scoped_profiles.find(attrs[:id]) : scoped_profiles.find_or_initialize_by(cohort_key: attrs[:cohort_key])
        profile.assign_attributes(
          school: school,
          academic_year: current_academic_year,
          created_by: actor || profile.created_by,
          name: attrs[:name].presence || default_name(attrs),
          status: attrs[:status].presence || profile.status || "draft",
          cohort_key: attrs[:cohort_key].presence || profile.cohort_key,
          archetype_key: attrs[:archetype_key].presence || "continuum",
          programme_scope: attrs[:programme_scope].presence || school_programme_scope,
          launch_window: attrs[:launch_window],
          go_live_target_on: attrs[:go_live_target_on],
          role_success_metrics: normalize_hash(attrs[:role_success_metrics]).presence || default_role_success_metrics,
          rollout_bundle: normalize_hash(attrs[:rollout_bundle]),
          metadata: profile.metadata.merge(normalize_hash(attrs[:metadata]))
        )
        profile.save!
        serialize_profile(profile)
      end

      def capture_baseline!(profile, metadata: {})
        benchmark = ::Ib::Support::WorkflowBenchmarkService.new(tenant: tenant, school: school).build
        metrics = baseline_metrics_for(profile)
        snapshot = profile.baseline_snapshots.create!(
          school: school,
          captured_by: actor,
          captured_at: Time.current,
          metric_payload: metrics,
          benchmark_payload: benchmark,
          metadata: metadata
        )
        profile.update!(baseline_summary: metrics.merge("captured_at" => snapshot.captured_at.utc.iso8601))

        ::Ib::Support::ActivityEventService.record!(
          tenant: tenant,
          school: school,
          user: actor,
          event_name: "ib.pilot.baseline.captured",
          event_family: "pilot_adoption",
          surface: "rollout_console",
          entity_ref: "IbPilotProfile:#{profile.id}",
          metadata: { snapshot_id: snapshot.id, cohort_key: profile.cohort_key }
        )

        serialize_snapshot(snapshot)
      end

      private

      attr_reader :tenant, :school, :actor

      def scoped_profiles
        scope = IbPilotProfile.where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school
        scope
      end

      def serialize_profile(profile)
        latest_snapshot = profile.baseline_snapshots.order(captured_at: :desc, id: :desc).first
        {
          id: profile.id,
          name: profile.name,
          status: profile.status,
          cohort_key: profile.cohort_key,
          archetype_key: profile.archetype_key,
          programme_scope: profile.programme_scope,
          launch_window: profile.launch_window,
          go_live_target_on: profile.go_live_target_on&.iso8601,
          role_success_metrics: profile.role_success_metrics,
          baseline_summary: profile.baseline_summary,
          readiness_summary: profile.readiness_summary,
          rollout_bundle: profile.rollout_bundle,
          baseline_snapshot_count: profile.baseline_snapshots.size,
          last_captured_at: latest_snapshot&.captured_at&.utc&.iso8601,
          created_at: profile.created_at.utc.iso8601,
          updated_at: profile.updated_at.utc.iso8601
        }
      end

      def serialize_snapshot(snapshot)
        {
          id: snapshot.id,
          pilot_profile_id: snapshot.ib_pilot_profile_id,
          status: snapshot.status,
          captured_at: snapshot.captured_at.utc.iso8601,
          metric_payload: snapshot.metric_payload,
          benchmark_payload: snapshot.benchmark_payload,
          metadata: snapshot.metadata
        }
      end

      def baseline_metrics_for(profile)
        receipts_total = count_for("IbDeliveryReceipt")
        receipts_read = count_for("IbDeliveryReceipt", state: [ "read", "acknowledged" ])
        {
          "profile_name" => profile.name,
          "teacher" => {
            "unit_count" => count_for("CurriculumDocument", document_type: [ "ib_pyp_unit", "ib_myp_unit", "ib_dp_course_map" ]),
            "evidence_queue" => count_for("IbEvidenceItem"),
            "time_to_first_unit" => "#{[ count_for("CurriculumDocument"), 1 ].max} tracked item(s)"
          },
          "specialist" => {
            "open_assignments" => count_for("IbSpecialistAssignment"),
            "library_items" => count_for("IbSpecialistLibraryItem"),
            "latency_watch" => count_for("IbDocumentComment", comment_type: "task")
          },
          "coordinator" => {
            "reports" => count_for("IbReport"),
            "review_queue" => count_for("IbReview"),
            "migration_sessions" => count_for("IbMigrationSession")
          },
          "student" => {
            "reflection_requests" => count_for("IbDocumentComment", comment_type: "suggestion"),
            "timeline_items" => count_for("IbOperationalRecord")
          },
          "guardian" => {
            "delivery_receipts" => receipts_total,
            "read_rate" => receipts_total.positive? ? ((receipts_read.to_f / receipts_total) * 100).round(1) : 0.0
          }
        }
      end

      def count_for(model_name, conditions = {})
        model = model_name.safe_constantize
        return 0 unless model

        scope = model.where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school && model.column_names.include?("school_id")
        conditions.each do |key, value|
          scope = scope.where(key => value)
        end
        scope.count
      rescue StandardError
        0
      end

      def current_academic_year
        return @current_academic_year if defined?(@current_academic_year)

        @current_academic_year = AcademicYear.where(tenant_id: tenant.id).order(start_date: :desc, id: :desc).first
      end

      def default_name(attrs)
        [ attrs[:programme_scope].presence || school_programme_scope, attrs[:archetype_key].presence || "pilot" ].join(" ").titleize
      end

      def school_programme_scope
        school&.respond_to?(:name) ? "Mixed" : "Mixed"
      end

      def default_role_success_metrics
        METRIC_DEFINITIONS.each_with_object({}) do |row, result|
          result[row[:key]] = row.slice(:label, :role, :target)
        end
      end

      def normalize_hash(value)
        value.is_a?(Hash) ? value.deep_stringify_keys : {}
      end
    end
  end
end
