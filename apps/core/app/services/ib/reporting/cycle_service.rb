module Ib
  module Reporting
    class CycleService
      ROLE_MATRIX = {
        "author" => "Teachers, advisors, and specialists draft evidence-backed entries.",
        "reviewer" => "Coordinators or delegated reviewers validate proofing and consistency.",
        "approver" => "Programme leadership clears delivery and archive state.",
        "family_viewer" => "Guardians and students consume released outputs and acknowledgements."
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
          cycles: cycle_scope.order(updated_at: :desc, id: :desc).map { |cycle| serialize_cycle(cycle) },
          templates: template_scope.order(updated_at: :desc, id: :desc).map { |template| serialize_template(template) },
          delivery_summary: delivery_summary
        }
      end

      def upsert_cycle!(attrs)
        cycle = attrs[:id].present? ? cycle_scope.find(attrs[:id]) : cycle_scope.find_or_initialize_by(cycle_key: attrs[:cycle_key])
        cycle.assign_attributes(
          school: school,
          academic_year: current_academic_year,
          created_by: actor || cycle.created_by,
          owner: actor || cycle.owner,
          programme: attrs[:programme].presence || cycle.programme || "Mixed",
          cycle_key: attrs[:cycle_key].presence || cycle.cycle_key || SecureRandom.hex(6),
          status: attrs[:status].presence || cycle.status || "draft",
          starts_on: attrs[:starts_on],
          ends_on: attrs[:ends_on],
          due_on: attrs[:due_on],
          delivery_window: cycle.delivery_window.merge(normalize_hash(attrs[:delivery_window])),
          localization_settings: cycle.localization_settings.merge(normalize_hash(attrs[:localization_settings])),
          approval_summary: cycle.approval_summary.merge(normalize_hash(attrs[:approval_summary])),
          metrics: cycle.metrics.merge(derived_metrics(attrs[:programme].presence || cycle.programme || "Mixed")),
          metadata: cycle.metadata.merge(normalize_hash(attrs[:metadata]))
        )
        cycle.save!
        serialize_cycle(cycle)
      end

      def upsert_template!(attrs)
        template = attrs[:id].present? ? template_scope.find(attrs[:id]) : template_scope.find_or_initialize_by(name: attrs[:name], family: attrs[:family])
        template.assign_attributes(
          school: school,
          created_by: actor || template.created_by,
          programme: attrs[:programme].presence || template.programme || "Mixed",
          audience: attrs[:audience].presence || template.audience || "internal",
          family: attrs[:family].presence || template.family || "conference_packet",
          name: attrs[:name].presence || template.name,
          status: attrs[:status].presence || template.status || "draft",
          schema_version: attrs[:schema_version].presence || template.schema_version || "phase9.v1",
          section_definitions: template.section_definitions.merge(normalize_hash(attrs[:section_definitions])),
          translation_rules: template.translation_rules.merge(normalize_hash(attrs[:translation_rules])),
          metadata: template.metadata.merge(normalize_hash(attrs[:metadata]))
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
          updated_at: template.updated_at.utc.iso8601
        }
      end

      def delivery_summary
        scope = IbReport.where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school
        {
          reports: scope.count,
          released: scope.where(status: "released").count,
          delivered: IbReportDelivery.where(tenant_id: tenant.id).yield_self { |delivery_scope| school ? delivery_scope.where(school_id: school.id) : delivery_scope }.where(status: [ "delivered", "read", "acknowledged" ]).count,
          acknowledged: IbDeliveryReceipt.where(tenant_id: tenant.id).yield_self { |receipt_scope| school ? receipt_scope.where(school_id: school.id) : receipt_scope }.where(state: "acknowledged").count
        }
      end

      def derived_metrics(programme)
        scope = IbReport.where(tenant_id: tenant.id, programme: programme)
        scope = scope.where(school_id: school.id) if school
        {
          "draft_count" => scope.where(status: %w[draft in_review signed_off]).count,
          "released_count" => scope.where(status: "released").count
        }
      end

      def current_academic_year
        @current_academic_year ||= AcademicYear.where(tenant_id: tenant.id).order(start_date: :desc, id: :desc).first
      end

      def normalize_hash(value)
        value.is_a?(Hash) ? value.deep_stringify_keys : {}
      end
    end
  end
end
