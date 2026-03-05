class CurriculumProfileResolver
  CACHE_TTL = 5.minutes
  RESOLVER_BUILD_VERSION = "2.0.0".freeze

  class << self
    def resolve(tenant:, school: nil, course: nil, academic_year: nil)
      academic_year ||= course&.academic_year
      cache_key = resolver_cache_key(
        tenant: tenant,
        school: school,
        course: course,
        academic_year: academic_year
      )

      Rails.cache.fetch(cache_key, expires_in: CACHE_TTL) do
        resolve_uncached(
          tenant: tenant,
          school: school,
          course: course,
          academic_year: academic_year
        )
      end
    end

    def invalidate_cache!(tenant:)
      settings = tenant.settings.is_a?(Hash) ? tenant.settings.deep_dup : {}
      settings["curriculum_resolver_cache_bust"] = settings.fetch("curriculum_resolver_cache_bust", 0).to_i + 1
      tenant.update_columns(settings: settings, updated_at: Time.current)
    end

    private

    def resolve_uncached(tenant:, school:, course:, academic_year:)
      trace_id = resolution_trace_id
      feature_flags = curriculum_feature_flags_for(tenant)
      candidates = build_candidates(
        tenant: tenant,
        school: school,
        course: course,
        academic_year: academic_year,
        feature_flags: feature_flags
      )

      selected, fallback_reason = choose_candidate(candidates, tenant: tenant, feature_flags: feature_flags)
      selected ||= system_fallback_candidate

      profile = select_profile(selected)
      if profile.nil?
        fallback_reason ||= "pack_validation_error"
        selected = system_fallback_candidate
        profile = select_profile(selected) || CurriculumProfileRegistry.fallback_profile
      end

      terminology = stringify_keys(profile["terminology"] || {})
      planner_taxonomy = stringify_keys(profile["planner_taxonomy"] || terminology)
      unit_schema_fields = Array(profile.dig("planner_object_schemas", "unit_plan", "fields")).map { |field| stringify_keys(field) }
      subject_options = field_options(unit_schema_fields, "subject") || Array(profile["subject_options"])
      grade_options = field_options(unit_schema_fields, "grade_or_stage") || Array(profile["grade_or_stage_options"])
      template_defaults = stringify_keys(profile["template_defaults"] || profile.dig("planner_object_schemas", "template", "defaults") || {})
      framework_defaults = Array(profile["framework_defaults"] || profile.dig("planner_object_schemas", "template", "tags") || [])

      {
        profile_key: profile.dig("identity", "key") || profile["key"],
        profile_version: profile.dig("versioning", "version") || profile["version"],
        resolved_profile_version: profile.dig("versioning", "version") || profile["version"],
        profile_label: profile.dig("identity", "label") || profile["label"],
        selected_from: selected[:selected_from],
        fallback_reason: fallback_reason,
        resolution_trace_id: trace_id,
        resolved_at: Time.current.utc.iso8601,
        resolver_build_version: RESOLVER_BUILD_VERSION,
        source: selected[:source],
        source_level: selected[:source],
        planner_taxonomy: planner_taxonomy,
        terminology: terminology,
        derived_labels: {
          subject_label: planner_taxonomy["subject_label"] || "Subject",
          grade_label: planner_taxonomy["grade_label"] || "Grade Level",
          unit_label: planner_taxonomy["unit_label"] || "Unit"
        },
        subject_options: subject_options,
        grade_or_stage_options: grade_options,
        framework_defaults: framework_defaults,
        template_defaults: template_defaults,
        integration_hints: stringify_keys(profile["integration_hints"] || {}),
        navigation: stringify_keys(profile["navigation"] || {}),
        planner_object_schemas: stringify_keys(profile["planner_object_schemas"] || {}),
        workflow_bindings: stringify_keys(profile["workflow_bindings"] || {}),
        report_bindings: stringify_keys(profile["report_bindings"] || {}),
        capability_modules: stringify_keys(profile["capability_modules"] || {}),
        status: profile["status"],
        candidate_chain: candidates.map { |candidate| candidate.slice(:level, :key, :version, :selected_from, :source) }
      }
    end

    def build_candidates(tenant:, school:, course:, academic_year:, feature_flags:)
      chain = []

      course_settings = stringify_keys(course&.settings || {})
      if course_settings["curriculum_profile_key"].present?
        chain << candidate(
          level: "course_settings",
          key: course_settings["curriculum_profile_key"],
          version: course_settings["curriculum_profile_version"],
          selected_from: "course_assignment",
          source: "course"
        )
      end

      if assignment_resolution_enabled?(tenant, feature_flags)
        chain.concat(assignment_candidates_for(scope_type: "course", tenant: tenant, course: course, academic_year: academic_year, selected_from: "course_assignment", source: "course"))
      end

      if school&.curriculum_profile_key.present?
        chain << candidate(
          level: "school_override",
          key: school.curriculum_profile_key,
          version: school.curriculum_profile_version,
          selected_from: "school_assignment",
          source: "school"
        )
      end

      if assignment_resolution_enabled?(tenant, feature_flags)
        chain.concat(assignment_candidates_for(scope_type: "school", tenant: tenant, school: school, academic_year: academic_year, selected_from: "school_assignment", source: "school"))
        chain.concat(assignment_candidates_for(scope_type: "academic_year", tenant: tenant, academic_year: academic_year, selected_from: "academic_year_freeze", source: "academic_year"))
        chain.concat(assignment_candidates_for(scope_type: "tenant", tenant: tenant, selected_from: "tenant_assignment", source: "tenant"))
      end

      tenant_default_key = tenant&.settings&.dig("curriculum_default_profile_key")
      tenant_default_version = tenant&.settings&.dig("curriculum_default_profile_version")
      if tenant_default_key.present?
        chain << candidate(
          level: "tenant_default",
          key: tenant_default_key,
          version: tenant_default_version,
          selected_from: "tenant_assignment",
          source: "tenant"
        )
      end

      district = tenant&.district
      district_default_key = district&.settings&.dig("curriculum_default_profile_key")
      district_default_version = district&.settings&.dig("curriculum_default_profile_version")
      if district_default_key.present?
        chain << candidate(
          level: "district_default",
          key: district_default_key,
          version: district_default_version,
          selected_from: "district_assignment",
          source: "district"
        )
      end

      chain << system_fallback_candidate
      chain
    end

    def assignment_candidates_for(scope_type:, tenant:, school: nil, course: nil, academic_year: nil, selected_from:, source:)
      query = CurriculumProfileAssignment
                .where(tenant_id: tenant.id, scope_type: scope_type, active: true)
                .latest_first

      case scope_type
      when "course"
        return [] unless course

        scoped = query.where(course_id: course.id)
        year_id = academic_year&.id
        scoped = if year_id
          scoped.where(academic_year_id: [ year_id, nil ])
        else
          scoped.where(academic_year_id: nil)
        end
      when "school"
        return [] unless school

        scoped = query.where(school_id: school.id)
        year_id = academic_year&.id
        scoped = if year_id
          scoped.where(academic_year_id: [ year_id, nil ])
        else
          scoped.where(academic_year_id: nil)
        end
      when "academic_year"
        return [] unless academic_year

        scoped = query.where(academic_year_id: academic_year.id, is_frozen: true)
      when "tenant"
        scoped = query.where(school_id: nil, course_id: nil, academic_year_id: nil)
      else
        return []
      end

      scoped.limit(2).map do |assignment|
        candidate(
          level: "assignment:#{scope_type}",
          key: assignment.profile_key,
          version: assignment.profile_version,
          selected_from: selected_from,
          source: source
        )
      end
    end

    def candidate(level:, key:, version:, selected_from:, source:)
      {
        level: level,
        key: key,
        version: version,
        selected_from: selected_from,
        source: source
      }
    end

    def choose_candidate(candidates, tenant:, feature_flags:)
      fallback_reason = nil

      candidates.each do |candidate|
        key = candidate[:key].to_s
        next if key.blank?

        profile = select_profile(candidate)
        if profile.nil?
          fallback_reason ||= candidate[:version].present? ? "missing_profile_version" : "missing_profile_key"
          next
        end

        if feature_flags[:curriculum_pack_lifecycle_v1]
          unless release_eligible?(tenant: tenant, key: key, version: profile.dig("versioning", "version") || profile["version"])
            fallback_reason ||= "invalid_profile_state"
            next
          end
        end

        return [ candidate, fallback_reason ]
      end

      [ nil, fallback_reason || "missing_profile_key" ]
    end

    def select_profile(candidate)
      key = candidate[:key].to_s
      version = candidate[:version].to_s.presence
      return nil if key.blank?

      CurriculumProfileRegistry.find(key, version)
    end

    def release_eligible?(tenant:, key:, version:)
      release = CurriculumProfileRelease
                .where(tenant_id: tenant.id, profile_key: key, profile_version: version)
                .latest_first
                .first

      return true if release.nil?

      %w[published frozen].include?(release.status)
    end

    def resolver_cache_key(tenant:, school:, course:, academic_year:)
      settings = tenant.settings.is_a?(Hash) ? tenant.settings : {}
      cache_bust = settings.fetch("curriculum_resolver_cache_bust", 0).to_i

      [
        "curriculum_resolver_v2",
        tenant.id,
        school&.id || "none",
        course&.id || "none",
        academic_year&.id || "none",
        cache_bust
      ].join(":")
    end

    def assignment_resolution_enabled?(tenant, feature_flags)
      return true if feature_flags[:curriculum_profile_version_pinning_v1]

      tenant.settings&.dig("curriculum_profile_assignment_enabled") == true
    end

    def curriculum_feature_flags_for(tenant)
      keys = %w[
        curriculum_pack_lifecycle_v1
        curriculum_profile_version_pinning_v1
      ]

      records_by_key = FeatureFlag
        .where(key: keys, tenant_id: [ tenant.id, nil ])
        .group_by(&:key)

      keys.each_with_object({}) do |key, memo|
        records = records_by_key[key] || []
        tenant_override = records.find { |record| record.tenant_id == tenant.id }
        global_override = records.find { |record| record.tenant_id.nil? }
        value = if tenant_override
          tenant_override.enabled
        elsif global_override
          global_override.enabled
        else
          FeatureFlag::DEFAULTS.fetch(key, false)
        end

        memo[key.to_sym] = value
      end
    end

    def system_fallback_candidate
      {
        level: "system_fallback",
        key: CurriculumProfileRegistry.default_profile_key,
        version: nil,
        selected_from: "system_fallback",
        source: "system"
      }
    end

    def field_options(fields, id)
      field = fields.find { |row| row["id"] == id }
      Array(field&.dig("options")).map(&:to_s)
    end

    def resolution_trace_id
      "crx_#{SecureRandom.hex(10)}"
    end

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
