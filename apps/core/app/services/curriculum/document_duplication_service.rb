module Curriculum
  class DocumentDuplicationService
    def initialize(actor:, school: nil)
      @actor = actor
      @school = school
    end

    def duplicate!(source:, planning_context: nil, title: nil, carry_forward: false)
      return duplicate_operational_record!(source, title: title, carry_forward: carry_forward) if source.is_a?(IbOperationalRecord)

      duplicate_document!(source, planning_context: planning_context, title: title, carry_forward: carry_forward)
    end

    private

    attr_reader :actor, :school

    def duplicate_document!(source, planning_context:, title:, carry_forward:)
      target_context = planning_context || source.planning_context
      metadata = source.metadata.deep_dup
      metadata["copied_from"] = Ib::RouteBuilder.entity_ref_for(source)
      metadata["carry_forward"] = carry_forward
      content = (source.current_version&.content || {}).deep_dup
      if carry_forward
        content["operational_state"] = {}
        content["recent_feedback"] = []
      end

      document = CurriculumDocument.create!(
        tenant: source.tenant,
        school: target_context.school,
        planning_context: target_context,
        academic_year: target_context.academic_year,
        created_by: actor,
        document_type: source.document_type,
        title: title.presence || default_title(source.title, carry_forward: carry_forward),
        status: "draft",
        pack_key: source.pack_key,
        pack_version: source.pack_version,
        schema_key: source.schema_key,
        settings: source.settings,
        metadata: metadata
      )
      document.create_version!(
        title: document.title,
        content: content,
        created_by: actor
      )
      document
    end

    def duplicate_operational_record!(source, title:, carry_forward:)
      metadata = source.metadata.deep_dup
      metadata["copied_from"] = Ib::RouteBuilder.entity_ref_for(source)
      metadata["carry_forward"] = carry_forward
      IbOperationalRecord.create!(
        tenant: source.tenant,
        school: source.school,
        planning_context: source.planning_context,
        curriculum_document: source.curriculum_document,
        student: source.student,
        owner: source.owner || actor,
        advisor: source.advisor,
        programme: source.programme,
        record_family: source.record_family,
        subtype: source.subtype,
        status: carry_forward ? "draft" : source.status,
        priority: source.priority,
        risk_level: carry_forward ? "healthy" : source.risk_level,
        due_on: carry_forward ? nil : source.due_on,
        title: title.presence || default_title(source.title, carry_forward: carry_forward),
        summary: source.summary,
        next_action: source.next_action,
        route_hint: source.route_hint,
        metadata: metadata
      )
    end

    def default_title(title, carry_forward:)
      suffix = carry_forward ? "Carry forward" : "Copy"
      "#{title} (#{suffix})"
    end
  end
end
