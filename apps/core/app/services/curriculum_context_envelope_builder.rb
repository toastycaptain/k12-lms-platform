class CurriculumContextEnvelopeBuilder
  class << self
    def for_course(tenant:, course:)
      resolved = CurriculumProfileResolver.resolve(
        tenant: tenant,
        school: course&.school,
        course: course,
        academic_year: course&.academic_year
      )

      build(
        resolved: resolved,
        tenant_id: tenant.id,
        school_id: course&.school_id,
        course_id: course&.id
      )
    end

    def build(resolved:, tenant_id:, school_id: nil, course_id: nil)
      hints = stringify_keys(resolved[:integration_hints] || {})

      {
        "curriculum_context" => {
          "tenant_id" => tenant_id,
          "school_id" => school_id,
          "course_id" => course_id,
          "effective_curriculum_profile_key" => resolved[:profile_key],
          "effective_curriculum_profile_version" => resolved[:resolved_profile_version] || resolved[:profile_version],
          "effective_curriculum_source" => resolved[:source],
          "selected_from" => resolved[:selected_from],
          "fallback_reason" => resolved[:fallback_reason],
          "resolution_trace_id" => resolved[:resolution_trace_id],
          "google_addon_context_tag" => hints["google_addon_context"],
          "lti_context_tag" => hints["lti_context_tag"],
          "oneroster_context_tag" => hints["oneroster_context_tag"],
          "classroom_context_tag" => hints["classroom_context_tag"]
        }
      }
    end

    private

    def stringify_keys(value)
      case value
      when Hash
        value.each_with_object({}) do |(key, item), memo|
          memo[key.to_s] = stringify_keys(item)
        end
      when Array
        value.map { |item| stringify_keys(item) }
      else
        value
      end
    end
  end
end
