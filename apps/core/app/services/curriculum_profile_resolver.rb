class CurriculumProfileResolver
  class << self
    def resolve(tenant:, school: nil, course: nil)
      selected_key, source = selected_profile_key(tenant: tenant, school: school, course: course)

      profile = CurriculumProfileRegistry.find(selected_key)
      if profile.nil?
        profile = CurriculumProfileRegistry.fallback_profile
        source = "system"
      end

      planner_taxonomy = profile["planner_taxonomy"] || {}
      subject_label = planner_taxonomy["subject_label"] || "Subject"
      grade_label = planner_taxonomy["grade_label"] || "Grade Level"
      unit_label = planner_taxonomy["unit_label"] || "Unit"

      {
        profile_key: profile["key"],
        profile_version: profile["version"],
        profile_label: profile["label"],
        source: source,
        source_level: source,
        planner_taxonomy: planner_taxonomy,
        derived_labels: {
          subject_label: subject_label,
          grade_label: grade_label,
          unit_label: unit_label
        },
        subject_options: profile["subject_options"] || [],
        grade_or_stage_options: profile["grade_or_stage_options"] || [],
        framework_defaults: profile["framework_defaults"] || [],
        template_defaults: profile["template_defaults"] || {},
        integration_hints: profile["integration_hints"] || {}
      }
    end

    private

    def selected_profile_key(tenant:, school:, course:)
      course_override = course&.settings&.dig("curriculum_profile_key")
      return [ course_override, "course" ] if course_override.present?

      school_override = school&.curriculum_profile_key
      return [ school_override, "school" ] if school_override.present?

      tenant_default = tenant&.settings&.dig("curriculum_default_profile_key")
      return [ tenant_default, "tenant" ] if tenant_default.present?

      [ CurriculumProfileRegistry.default_profile_key, "system" ]
    end
  end
end
