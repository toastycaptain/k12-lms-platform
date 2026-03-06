module Ib
  module Migration
    class LegacyPlanBackfillService
      Result = Struct.new(:created_document_ids, :skipped_legacy_ids, :errors, keyword_init: true)

      def initialize(tenant:, actor:)
        @tenant = tenant
        @actor = actor
      end

      def run!
        created_document_ids = []
        skipped_legacy_ids = []
        errors = []

        UnitPlan.where(tenant_id: tenant.id).find_each do |unit_plan|
          if migrated_document_for(unit_plan).exists?
            skipped_legacy_ids << unit_plan.id
            next
          end

          planning_context = ensure_planning_context_for(unit_plan)
          document = Curriculum::DocumentFactory.create!(
            planning_context: planning_context,
            document_type: target_document_type_for(unit_plan),
            title: unit_plan.title,
            created_by: actor,
            schema_key: target_schema_key_for(unit_plan),
            initial_content: {
              migrated_from: { type: unit_plan.class.name, id: unit_plan.id },
              legacy_status: unit_plan.status,
              legacy_summary: unit_plan.respond_to?(:summary) ? unit_plan.summary : nil
            }.compact
          )
          document.update!(metadata: document.metadata.merge("migrated_from" => { "type" => unit_plan.class.name, "id" => unit_plan.id }))
          created_document_ids << document.id
        rescue StandardError => e
          errors << { legacy_type: unit_plan.class.name, legacy_id: unit_plan.id, message: e.message }
        end

        Result.new(created_document_ids: created_document_ids, skipped_legacy_ids: skipped_legacy_ids, errors: errors)
      end

      private

      attr_reader :tenant, :actor

      def migrated_document_for(legacy_record)
        CurriculumDocument.where(tenant_id: tenant.id).where("metadata -> 'migrated_from' ->> 'type' = ?", legacy_record.class.name)
          .where("metadata -> 'migrated_from' ->> 'id' = ?", legacy_record.id.to_s)
      end

      def ensure_planning_context_for(unit_plan)
        school = unit_plan.course&.school || actor.tenant.schools.first
        academic_year = unit_plan.course&.academic_year || tenant.academic_years.order(:id).first
        PlanningContext.find_or_create_by!(
          tenant: tenant,
          school: school,
          academic_year: academic_year,
          name: unit_plan.course&.name || "Migrated IB Context",
          kind: "course"
        ) do |context|
          context.created_by = actor
          context.status = "active"
        end
      end

      def target_document_type_for(unit_plan)
        schema = target_schema_key_for(unit_plan)
        return "ib_pyp_unit" if schema.include?("pyp")
        return "ib_myp_unit" if schema.include?("myp")
        return "ib_dp_course_map" if schema.include?("dp")

        "unit_plan"
      end

      def target_schema_key_for(unit_plan)
        current = unit_plan.respond_to?(:schema_key) ? unit_plan.schema_key.to_s : ""
        return "ib.pyp.unit@v2" if current.include?("pyp")
        return "ib.dp.course_map@v2" if current.include?("dp")

        "ib.myp.unit@v2"
      end
    end
  end
end
