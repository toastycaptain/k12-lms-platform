module Ib
  module Reporting
    class CycleService
      ROLE_MATRIX = {
        "author" => "Teachers, advisors, and specialists draft evidence-backed entries.",
        "reviewer" => "Coordinators or delegated reviewers validate proofing and consistency.",
        "approver" => "Programme leadership clears delivery and archive state.",
        "family_viewer" => "Guardians and students consume released outputs and acknowledgements."
      }.freeze

      CANONICAL_CONTRACT = {
        version: "phase10.v1",
        families: %w[pyp_narrative myp_snapshot dp_progress conference_packet],
        render_targets: %w[web_view print_layout pdf_artifact],
        archive_policy: "versioned_per_release",
        translation_policy: "fallback_with_human_review"
      }.freeze

      def initialize(tenant:, school: nil, actor: nil)
        @tenant = tenant
        @school = school
        @actor = actor
      end

      def index_payload
        {
          generated_at: Time.current.utc.iso8601,
          role_matrix: ROLE_MATRIX,
          lifecycle: IbReportCycle::STATUS_TYPES,
          canonical_contract: CANONICAL_CONTRACT,
          cycles: cycle_scope.order(updated_at: :desc, id: :desc).map { |cycle| serialize_cycle(cycle) },
          templates: template_scope.order(updated_at: :desc, id: :desc).map { |template| serialize_template(template) },
          delivery_summary: delivery_summary,
          proofing_queue: proofing_queue,
          localization_pipeline: localization_pipeline,
          archive_summary: archive_summary,
          release_gates: release_gates,
          analytics_summary: analytics_summary
        }
      end

      def upsert_cycle!(attrs)
        cycle = attrs[:id].present? ? cycle_scope.find(attrs[:id]) : cycle_scope.find_or_initialize_by(cycle_key: attrs[:cycle_key])
        programme = attrs[:programme].presence || cycle.programme || "Mixed"
        cycle.assign_attributes(
          school: school,
          academic_year: current_academic_year,
          created_by: actor || cycle.created_by,
          owner: actor || cycle.owner,
          programme: programme,
          cycle_key: attrs[:cycle_key].presence || cycle.cycle_key || SecureRandom.hex(6),
          status: attrs[:status].presence || cycle.status || "draft",
          starts_on: attrs[:starts_on],
          ends_on: attrs[:ends_on],
          due_on: attrs[:due_on],
          delivery_window: default_delivery_window(programme).merge(cycle.delivery_window).merge(normalize_hash(attrs[:delivery_window])),
          localization_settings: default_localization_settings.merge(cycle.localization_settings).merge(normalize_hash(attrs[:localization_settings])),
          approval_summary: default_approval_summary.merge(cycle.approval_summary).merge(normalize_hash(attrs[:approval_summary])),
          metrics: cycle.metrics.merge(derived_metrics(programme)),
          metadata: cycle.metadata.merge(normalize_hash(attrs[:metadata]))
        )
        cycle.save!
        serialize_cycle(cycle)
      end

      def upsert_template!(attrs)
        template = attrs[:id].present? ? template_scope.find(attrs[:id]) : template_scope.find_or_initialize_by(name: attrs[:name], family: attrs[:family])
        family = attrs[:family].presence || template.family || "conference_packet"
        audience = attrs[:audience].presence || template.audience || "internal"
        template.assign_attributes(
          school: school,
          created_by: actor || template.created_by,
          programme: attrs[:programme].presence || template.programme || "Mixed",
          audience: audience,
          family: family,
          name: attrs[:name].presence || template.name,
          status: attrs[:status].presence || template.status || "draft",
          schema_version: attrs[:schema_version].presence || template.schema_version || "phase10.v1",
          section_definitions: default_section_definitions(family).merge(template.section_definitions).merge(normalize_hash(attrs[:section_definitions])),
          translation_rules: default_translation_rules(audience).merge(template.translation_rules).merge(normalize_hash(attrs[:translation_rules])),
          metadata: template.metadata.merge(normalize_hash(attrs[:metadata])).merge(
            "render_hooks" => render_hooks_for(family),
            "fallback_locales" => default_localization_settings["fallback_locales"]
          )
        )
        template.save!
        serialize_template(template)
      end

      private

      attr_reader :tenant, :school, :actor

      def cycle_scope
        scope = IbReportCycle.where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school
        scope
      end

      def template_scope
        scope = IbReportTemplate.where(tenant_id: tenant.id)
        scope = scope.where(school_id: [ school&.id, nil ].compact) if school
        scope
      end

      def serialize_cycle(cycle)
        {
          id: cycle.id,
          programme: cycle.programme,
          cycle_key: cycle.cycle_key,
          status: cycle.status,
          starts_on: cycle.starts_on&.iso8601,
          ends_on: cycle.ends_on&.iso8601,
          due_on: cycle.due_on&.iso8601,
          delivery_window: cycle.delivery_window,
          localization_settings: cycle.localization_settings,
          approval_summary: cycle.approval_summary,
          metrics: cycle.metrics,
          report_count: cycle.reports.count,
          release_gates: cycle_release_gates(cycle),
          archive_summary: cycle_archive_summary(cycle),
          analytics: cycle_analytics(cycle),
          updated_at: cycle.updated_at.utc.iso8601
        }
      end

      def serialize_template(template)
        {
          id: template.id,
          programme: template.programme,
          audience: template.audience,
          family: template.family,
          name: template.name,
          status: template.status,
          schema_version: template.schema_version,
          section_definitions: template.section_definitions,
          translation_rules: template.translation_rules,
          report_contract: {
            canonical_family: template.family,
            render_hooks: render_hooks_for(template.family),
            fallback_locales: Array(template.metadata["fallback_locales"] || default_localization_settings["fallback_locales"])
          },
          updated_at: template.updated_at.utc.iso8601
        }
      end

      def delivery_summary
        scope = IbReport.where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school
        delivery_scope = IbReportDelivery.where(tenant_id: tenant.id)
        delivery_scope = delivery_scope.where(school_id: school.id) if school
        receipt_scope = IbDeliveryReceipt.where(tenant_id: tenant.id)
        receipt_scope = receipt_scope.where(school_id: school.id) if school
        {
          reports: scope.count,
          released: scope.where(status: "released").count,
          delivered: delivery_scope.where(status: [ "delivered", "read", "acknowledged" ]).count,
          acknowledged: receipt_scope.where(state: "acknowledged").count,
          pdf_ready: delivery_scope.where(channel: "pdf").count,
          guardian_views: delivery_scope.where(audience_role: "guardian").count
        }
      end

      def proofing_queue
        report_scope = IbReport.where(tenant_id: tenant.id)
        report_scope = report_scope.where(school_id: school.id) if school
        report_scope.order(updated_at: :desc).limit(6).map do |report|
          {
            id: report.id,
            title: report.title,
            status: report.status,
            missing_sections: report.proofing_summary["missing_sections"].to_i,
            overlong_items: report.proofing_summary["overlong_items"].to_i,
            warnings: Array(report.proofing_summary["preflight_warnings"]),
            href: "/ib/reports#report-#{report.id}"
          }
        end
      end

      def localization_pipeline
        template_scope.order(updated_at: :desc).limit(6).map do |template|
          {
            template_id: template.id,
            name: template.name,
            audience: template.audience,
            default_locale: template.translation_rules["default_locale"] || "en",
            required_locales: Array(template.translation_rules["required_locales"]),
            fallback_locales: Array(template.translation_rules["fallback_locales"]),
            human_review_required: ActiveModel::Type::Boolean.new.cast(template.translation_rules["human_review_required"])
          }
        end
      end

      def archive_summary
        report_scope = IbReport.where(tenant_id: tenant.id)
        report_scope = report_scope.where(school_id: school.id) if school
        version_scope = IbReportVersion.joins(:ib_report).where(ib_reports: { tenant_id: tenant.id })
        version_scope = version_scope.where(ib_reports: { school_id: school.id }) if school
        {
          retained_reports: report_scope.count,
          retained_versions: version_scope.count,
          archived_releases: report_scope.where(status: %w[released archived]).count,
          artifact_retention: "7y"
        }
      end

      def release_gates
        report_scope = IbReport.where(tenant_id: tenant.id)
        report_scope = report_scope.where(school_id: school.id) if school
        {
          proofing_clear: report_scope.where(status: "signed_off").count,
          awaiting_release: report_scope.where(status: "signed_off").count,
          awaiting_acknowledgement: IbReportDelivery.where(tenant_id: tenant.id).yield_self { |scope| school ? scope.where(school_id: school.id) : scope }.where(status: %w[delivered read]).count,
          localization_review: template_scope.where("translation_rules::text ILIKE ?", "%human_review_required%true%").count
        }
      end

      def analytics_summary
        delivery_scope = IbReportDelivery.where(tenant_id: tenant.id)
        delivery_scope = delivery_scope.where(school_id: school.id) if school
        delivered = delivery_scope.where(status: %w[delivered read acknowledged]).count
        read = delivery_scope.where.not(read_at: nil).count
        acknowledged = delivery_scope.where.not(acknowledged_at: nil).count
        {
          delivered: delivered,
          read: read,
          acknowledged: acknowledged,
          open_rate: delivered.positive? ? ((read.to_f / delivered) * 100).round(1) : 0.0,
          acknowledgement_rate: delivered.positive? ? ((acknowledged.to_f / delivered) * 100).round(1) : 0.0
        }
      end

      def derived_metrics(programme)
        scope = IbReport.where(tenant_id: tenant.id, programme: programme)
        scope = scope.where(school_id: school.id) if school
        {
          "draft_count" => scope.where(status: %w[draft in_review signed_off]).count,
          "released_count" => scope.where(status: "released").count,
          "guardian_deliveries" => scope.where(audience: "guardian").count,
          "conference_packets" => scope.where(report_family: "conference_packet").count
        }
      end

      def cycle_release_gates(cycle)
        reports = cycle.reports
        {
          proofing_clear: reports.where(status: "signed_off").count,
          released: reports.where(status: "released").count,
          archive_ready: reports.where.not(released_at: nil).count,
          localization_complete: reports.count { |report| Array(report.metadata.dig("localization", "fallback_locales")).empty? }
        }
      end

      def cycle_archive_summary(cycle)
        {
          report_versions: cycle.reports.joins(:versions).count,
          retained_reports: cycle.reports.count,
          delivered_outputs: cycle.reports.joins(:deliveries).count,
          proofing_failures: cycle.reports.count { |report| report.proofing_summary["missing_sections"].to_i.positive? }
        }
      end

      def cycle_analytics(cycle)
        deliveries = IbReportDelivery.where(ib_report_id: cycle.reports.select(:id))
        delivered = deliveries.where(status: %w[delivered read acknowledged]).count
        reads = deliveries.where.not(read_at: nil).count
        {
          delivered: delivered,
          read: reads,
          open_rate: delivered.positive? ? ((reads.to_f / delivered) * 100).round(1) : 0.0
        }
      end

      def current_academic_year
        @current_academic_year ||= AcademicYear.where(tenant_id: tenant.id).order(start_date: :desc, id: :desc).first
      end

      def normalize_hash(value)
        value.is_a?(Hash) ? value.deep_stringify_keys : {}
      end

      def default_delivery_window(programme)
        {
          "programme" => programme,
          "web_release" => true,
          "pdf_release" => true,
          "conference_packet" => true,
          "ack_window_days" => 7
        }
      end

      def default_localization_settings
        {
          "default_locale" => "en",
          "required_locales" => %w[en es fr],
          "fallback_locales" => [ "en" ],
          "human_review_required" => true
        }
      end

      def default_approval_summary
        {
          "author_required" => true,
          "reviewer_required" => true,
          "approver_required" => true,
          "guardian_ack_required" => true
        }
      end

      def default_section_definitions(family)
        case family
        when "pyp_narrative"
          {
            "learning_story" => { "required" => true },
            "learner_profile" => { "required" => true },
            "atl_growth" => { "required" => true },
            "family_support" => { "required" => false }
          }
        when "myp_snapshot"
          {
            "criteria_snapshot" => { "required" => true },
            "atl_snapshot" => { "required" => true },
            "interdisciplinary_summary" => { "required" => false },
            "project_summary" => { "required" => true }
          }
        when "dp_progress"
          {
            "ia_progress" => { "required" => true },
            "core_components" => { "required" => true },
            "transcript_bridge" => { "required" => true }
          }
        else
          {
            "progress_highlights" => { "required" => true },
            "student_led_questions" => { "required" => true },
            "family_support" => { "required" => true }
          }
        end
      end

      def default_translation_rules(audience)
        {
          "default_locale" => "en",
          "required_locales" => audience == "internal" ? [ "en" ] : %w[en es fr],
          "fallback_locales" => [ "en" ],
          "human_review_required" => audience != "internal"
        }
      end

      def render_hooks_for(family)
        {
          "web_viewer" => true,
          "print_layout" => family != "conference_packet" ? "standard_packet" : "conference_packet",
          "pdf_worker" => true,
          "artifact_storage" => "active_storage"
        }
      end
    end
  end
end
