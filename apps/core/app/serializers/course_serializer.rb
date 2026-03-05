class CourseSerializer < ActiveModel::Serializer
  attributes :id, :name, :code, :description, :academic_year_id, :school_id,
             :effective_curriculum_profile_key, :effective_curriculum_profile_version, :effective_curriculum_source,
             :curriculum_selected_from, :curriculum_fallback_reason, :curriculum_resolution_trace_id,
             :curriculum_context, :created_at, :updated_at
  has_many :sections

  def effective_curriculum_profile_key
    resolved_context[:profile_key]
  end

  def effective_curriculum_profile_version
    resolved_context[:resolved_profile_version] || resolved_context[:profile_version]
  end

  def effective_curriculum_source
    resolved_context[:source]
  end

  def curriculum_selected_from
    resolved_context[:selected_from]
  end

  def curriculum_fallback_reason
    resolved_context[:fallback_reason]
  end

  def curriculum_resolution_trace_id
    resolved_context[:resolution_trace_id]
  end

  def curriculum_context
    labels = resolved_context[:derived_labels] || {}
    {
      subject_label: labels[:subject_label] || "Subject",
      grade_label: labels[:grade_label] || "Grade Level",
      unit_label: labels[:unit_label] || "Unit",
      terminology: resolved_context[:terminology] || {},
      subject_options: resolved_context[:subject_options],
      grade_or_stage_options: resolved_context[:grade_or_stage_options],
      framework_defaults: resolved_context[:framework_defaults],
      template_defaults: resolved_context[:template_defaults],
      integration_hints: resolved_context[:integration_hints],
      navigation: resolved_context[:navigation],
      planner_object_schemas: resolved_context[:planner_object_schemas],
      workflow_bindings: resolved_context[:workflow_bindings],
      report_bindings: resolved_context[:report_bindings],
      capability_modules: resolved_context[:capability_modules]
    }
  end

  private

  def resolved_context
    @resolved_context ||= CurriculumProfileResolver.resolve(
      tenant: Current.tenant || object.tenant,
      school: object.school,
      course: object
    )
  end
end
