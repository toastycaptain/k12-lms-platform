module Api
  module V1
    module Admin
      class CurriculumSettingsController < ApplicationController
        def show
          authorize :curriculum_settings, :show?
          CurriculumCourseMappingService.refresh_unresolved!(tenant: Current.tenant)
          render json: settings_payload
        end

        def update
          authorize :curriculum_settings, :update?

          ActiveRecord::Base.transaction do
            apply_tenant_default!
            raise ActiveRecord::Rollback if performed?

            apply_school_overrides!
            raise ActiveRecord::Rollback if performed?

            apply_course_pins!
            raise ActiveRecord::Rollback if performed?

            apply_academic_year_freezes!
            raise ActiveRecord::Rollback if performed?

            apply_course_mapping_resolutions!
            raise ActiveRecord::Rollback if performed?
          end
          return if performed?

          CurriculumProfileResolver.invalidate_cache!(tenant: Current.tenant)

          audit_event(
            "curriculum.settings.updated",
            auditable: Current.tenant,
            metadata: {
              tenant_id: Current.tenant.id,
              tenant_default_profile_key: Current.tenant.settings&.dig("curriculum_default_profile_key"),
              tenant_default_profile_version: Current.tenant.settings&.dig("curriculum_default_profile_version"),
              school_override_count: Array(params[:school_overrides]).size,
              course_pin_count: Array(params[:course_pins]).size,
              academic_year_freeze_count: Array(params[:academic_year_freezes]).size,
              resolved_course_mapping_count: Array(params[:course_mapping_resolutions]).size
            }
          )

          render json: settings_payload
        end

        def import
          authorize :curriculum_settings, :update?

          operation = params[:operation].to_s.presence || "import"
          service = CurriculumProfileLifecycleService.new(tenant: Current.tenant, actor: Current.user)

          case operation
          when "validate"
            validation = service.validate_payload(import_payload)
            status = validation[:valid] ? :ok : :unprocessable_content
            render json: validation, status: status
          when "import"
            release = service.import!(payload: import_payload, checksum: params[:checksum], metadata: import_metadata)
            audit_event("curriculum.settings.imported", auditable: release, metadata: lifecycle_audit_metadata(operation, release))
            render json: lifecycle_release_payload(release), status: :created
          when "publish"
            release = service.publish!(profile_key: lifecycle_profile_key!, profile_version: lifecycle_profile_version!, metadata: import_metadata)
            audit_event("curriculum.settings.published", auditable: release, metadata: lifecycle_audit_metadata(operation, release))
            render json: lifecycle_release_payload(release)
          when "deprecate"
            release = service.deprecate!(profile_key: lifecycle_profile_key!, profile_version: lifecycle_profile_version!, metadata: import_metadata)
            audit_event("curriculum.settings.deprecated", auditable: release, metadata: lifecycle_audit_metadata(operation, release))
            render json: lifecycle_release_payload(release)
          when "freeze"
            release = service.freeze!(profile_key: lifecycle_profile_key!, profile_version: lifecycle_profile_version!, metadata: import_metadata)
            audit_event("curriculum.settings.frozen", auditable: release, metadata: lifecycle_audit_metadata(operation, release))
            render json: lifecycle_release_payload(release)
          when "rollback"
            release = service.rollback!(
              profile_key: lifecycle_profile_key!,
              profile_version: lifecycle_profile_version!,
              rollback_to_version: rollback_to_version!,
              metadata: import_metadata
            )
            audit_event("curriculum.settings.rolled_back", auditable: release, metadata: lifecycle_audit_metadata(operation, release))
            render json: lifecycle_release_payload(release)
          else
            render json: { error: "Unsupported operation '#{operation}'" }, status: :unprocessable_content
          end
        rescue CurriculumProfileLifecycleService::LifecycleError => e
          render json: { error: e.message }, status: :unprocessable_content
        end

        private

        def settings_payload
          school_scope = policy_scope(School).order(:name)
          course_scope = policy_scope(Course).includes(:school, :academic_year).order(:name)
          available_packs = available_packs_payload

          {
            tenant_default_profile_key: Current.tenant.settings&.dig("curriculum_default_profile_key") || CurriculumProfileRegistry.default_profile_key,
            tenant_default_profile_version: Current.tenant.settings&.dig("curriculum_default_profile_version"),
            available_packs: available_packs,
            available_profile_keys: available_packs.map { |pack| pack[:key] }.uniq,
            available_profiles: available_packs.map { |pack|
              {
                key: pack[:key],
                version: pack[:version],
                label: pack[:label],
                status: pack[:pack_status],
                compatibility: pack[:compatibility]
              }
            },
            school_overrides: school_scope.map { |school|
              resolved = CurriculumProfileResolver.resolve(tenant: Current.tenant, school: school)
              {
                school_id: school.id,
                school_name: school.name,
                curriculum_profile_key: school.curriculum_profile_key,
                curriculum_profile_version: school.curriculum_profile_version,
                effective_curriculum_profile_key: resolved[:profile_key],
                effective_curriculum_profile_version: resolved[:resolved_profile_version],
                effective_curriculum_source: resolved[:source],
                selected_from: resolved[:selected_from]
              }
            },
            course_pins: course_pin_payload(course_scope),
            academic_year_freezes: academic_year_freeze_payload,
            lifecycle_releases: lifecycle_release_list,
            unresolved_course_mappings: unresolved_course_mapping_payload,
            diagnostics: diagnostics_payload
          }
        end

        def apply_tenant_default!
          return unless params.key?(:tenant_default_profile_key) || params.key?(:tenant_default_profile_version)

          key = params[:tenant_default_profile_key].presence
          version = params[:tenant_default_profile_version].presence

          if key.present? && !pack_exists?(key)
            render json: { error: "Invalid tenant_default_profile_key" }, status: :unprocessable_content
            return
          end

          if key.present? && version.present? && !pack_exists?(key, version)
            render json: { error: "Invalid tenant_default_profile_version for key '#{key}'" }, status: :unprocessable_content
            return
          end

          settings = (Current.tenant.settings || {}).deep_dup
          settings["curriculum_default_profile_key"] = key || CurriculumProfileRegistry.default_profile_key
          settings["curriculum_default_profile_version"] = version
          settings["curriculum_profile_assignment_enabled"] = true
          Current.tenant.update!(settings: settings)

          assignment = CurriculumProfileAssignment.find_or_initialize_by(
            tenant_id: Current.tenant.id,
            scope_type: "tenant",
            school_id: nil,
            course_id: nil,
            academic_year_id: nil,
            active: true
          )
          assignment.assign_attributes(
            profile_key: settings["curriculum_default_profile_key"],
            profile_version: settings["curriculum_default_profile_version"],
            pinned: true,
            is_frozen: false,
            assigned_by: Current.user
          )
          assignment.save!
        end

        def apply_school_overrides!
          school_updates = Array(params[:school_overrides])
          school_updates.each do |entry|
            school_id = entry[:school_id] || entry["school_id"]
            key = entry[:curriculum_profile_key] || entry["curriculum_profile_key"]
            version = entry[:curriculum_profile_version] || entry["curriculum_profile_version"]

            school = policy_scope(School).find(school_id)
            authorize school, :update?

            if key.present? && !pack_exists?(key, version)
              render json: { error: "Invalid curriculum_profile_key/version for school_id=#{school.id}" }, status: :unprocessable_content
              return
            end

            school.update!(
              curriculum_profile_key: key.presence,
              curriculum_profile_version: version.presence
            )

            upsert_scope_assignment!(
              scope_type: "school",
              school: school,
              course: nil,
              academic_year: nil,
              key: key,
              version: version,
              pinned: true,
              is_frozen: false
            )
          end
        end

        def apply_course_pins!
          Array(params[:course_pins]).each do |entry|
            course_id = entry[:course_id] || entry["course_id"]
            key = entry[:curriculum_profile_key] || entry["curriculum_profile_key"]
            version = entry[:curriculum_profile_version] || entry["curriculum_profile_version"]
            academic_year_id = entry[:academic_year_id] || entry["academic_year_id"]

            course = policy_scope(Course).find(course_id)
            authorize course, :update?

            if key.present? && !pack_exists?(key, version)
              render json: { error: "Invalid curriculum_profile_key/version for course_id=#{course.id}" }, status: :unprocessable_content
              return
            end

            if key.present?
              settings = course.settings.is_a?(Hash) ? course.settings.deep_dup : {}
              settings["curriculum_profile_key"] = key
              settings["curriculum_profile_version"] = version.presence
              course.update!(settings: settings)
            else
              settings = course.settings.is_a?(Hash) ? course.settings.deep_dup : {}
              settings.delete("curriculum_profile_key")
              settings.delete("curriculum_profile_version")
              course.update!(settings: settings)
            end

            academic_year = if academic_year_id.present?
              AcademicYear.find_by!(id: academic_year_id, tenant_id: Current.tenant.id)
            end

            upsert_scope_assignment!(
              scope_type: "course",
              school: nil,
              course: course,
              academic_year: academic_year,
              key: key,
              version: version,
              pinned: true,
              is_frozen: false
            )
          end
        end

        def apply_academic_year_freezes!
          Array(params[:academic_year_freezes]).each do |entry|
            academic_year_id = entry[:academic_year_id] || entry["academic_year_id"]
            key = entry[:curriculum_profile_key] || entry["curriculum_profile_key"]
            version = entry[:curriculum_profile_version] || entry["curriculum_profile_version"]
            frozen = ActiveModel::Type::Boolean.new.cast(entry[:frozen] || entry["frozen"])

            academic_year = AcademicYear.find_by!(id: academic_year_id, tenant_id: Current.tenant.id)

            if frozen && key.present? && !pack_exists?(key, version)
              render json: { error: "Invalid freeze curriculum_profile_key/version for academic_year_id=#{academic_year.id}" }, status: :unprocessable_content
              return
            end

            upsert_scope_assignment!(
              scope_type: "academic_year",
              school: nil,
              course: nil,
              academic_year: academic_year,
              key: key,
              version: version,
              pinned: frozen,
              is_frozen: frozen
            )
          end
        end

        def apply_course_mapping_resolutions!
          Array(params[:course_mapping_resolutions]).each do |entry|
            issue_id = entry[:issue_id] || entry["issue_id"]
            school_id = entry[:school_id] || entry["school_id"]
            next if issue_id.blank? || school_id.blank?

            CurriculumCourseMappingService.resolve!(
              tenant: Current.tenant,
              issue_id: issue_id,
              school_id: school_id,
              actor: Current.user
            )
          end
        end

        def upsert_scope_assignment!(scope_type:, school:, course:, academic_year:, key:, version:, pinned:, is_frozen:)
          where_attrs = {
            tenant_id: Current.tenant.id,
            scope_type: scope_type,
            school_id: school&.id,
            course_id: course&.id,
            academic_year_id: academic_year&.id,
            active: true
          }

          if key.blank?
            CurriculumProfileAssignment.where(where_attrs).delete_all
            return
          end

          assignment = CurriculumProfileAssignment.find_or_initialize_by(where_attrs)
          assignment.assign_attributes(
            profile_key: key,
            profile_version: version.presence,
            pinned: pinned,
            is_frozen: is_frozen,
            assigned_by: Current.user
          )
          assignment.save!
        end

        def course_pin_payload(course_scope)
          assignments = CurriculumProfileAssignment
                        .where(tenant_id: Current.tenant.id, scope_type: "course", active: true)
                        .index_by { |row| [ row.course_id, row.academic_year_id ] }

          course_scope.map do |course|
            assignment = assignments[[ course.id, course.academic_year_id ]] || assignments[[ course.id, nil ]]
            next unless assignment

            {
              course_id: course.id,
              course_name: course.name,
              school_id: course.school_id,
              school_name: course.school&.name,
              academic_year_id: assignment.academic_year_id,
              profile_key: assignment.profile_key,
              profile_version: assignment.profile_version,
              pinned: assignment.pinned,
              is_frozen: assignment.is_frozen
            }
          end.compact
        end

        def academic_year_freeze_payload
          CurriculumProfileAssignment
            .where(tenant_id: Current.tenant.id, scope_type: "academic_year", active: true, is_frozen: true)
            .includes(:academic_year)
            .latest_first
            .map do |assignment|
              {
                assignment_id: assignment.id,
                academic_year_id: assignment.academic_year_id,
                academic_year_name: assignment.academic_year&.name,
                profile_key: assignment.profile_key,
                profile_version: assignment.profile_version,
                is_frozen: assignment.is_frozen,
                pinned: assignment.pinned
              }
            end
        end

        def lifecycle_release_list
          CurriculumProfileRelease
            .where(tenant_id: Current.tenant.id)
            .latest_first
            .limit(100)
            .map { |release| lifecycle_release_payload(release) }
        end

        def lifecycle_release_payload(release)
          {
            id: release.id,
            profile_key: release.profile_key,
            profile_version: release.profile_version,
            status: release.status,
            checksum: release.checksum,
            published_at: release.published_at,
            deprecated_at: release.deprecated_at,
            frozen_at: release.frozen_at,
            rolled_back_from_version: release.rolled_back_from_version,
            metadata: release.metadata,
            updated_at: release.updated_at
          }
        end

        def unresolved_course_mapping_payload
          CurriculumCourseMappingIssue
            .where(tenant_id: Current.tenant.id, status: "unresolved")
            .includes(:course)
            .map do |issue|
              {
                issue_id: issue.id,
                course_id: issue.course_id,
                course_name: issue.course&.name,
                reason: issue.reason,
                candidate_school_ids: issue.candidate_school_ids
              }
            end
        end

        def diagnostics_payload
          return nil unless params[:course_id].present?

          course = policy_scope(Course).includes(:school, :academic_year).find(params[:course_id])
          authorize course, :show?

          resolved = CurriculumProfileResolver.resolve(
            tenant: Current.tenant,
            school: course.school,
            course: course,
            academic_year: course.academic_year
          )

          {
            course_id: course.id,
            school_id: course.school_id,
            academic_year_id: course.academic_year_id,
            effective: {
              profile_key: resolved[:profile_key],
              resolved_profile_version: resolved[:resolved_profile_version],
              selected_from: resolved[:selected_from],
              fallback_reason: resolved[:fallback_reason],
              resolution_trace_id: resolved[:resolution_trace_id],
              source: resolved[:source],
              resolved_at: resolved[:resolved_at]
            },
            candidates: resolved[:candidate_chain]
          }
        end

        def pack_exists?(key, version = nil)
          CurriculumPackStore.exists?(tenant: Current.tenant, key: key, version: version)
        end

        def available_packs_payload
          CurriculumPackStore.list(tenant: Current.tenant).map do |entry|
            key = entry[:key]
            version = entry[:version]
            payload = CurriculumPackStore.fetch(tenant: Current.tenant, key: key, version: version)

            {
              key: key,
              version: version,
              label: entry[:label],
              pack_status: entry[:pack_status],
              release_status: entry[:release_status],
              source: entry[:source],
              compatibility: payload&.dig("versioning", "compatibility")
            }
          end
        end

        def import_payload
          payload = params[:payload]
          return payload.permit!.to_h if payload.respond_to?(:permit!)
          return payload.to_h if payload.respond_to?(:to_h)

          payload
        end

        def import_metadata
          metadata = params[:metadata]
          return {} if metadata.blank?
          return metadata.permit!.to_h if metadata.respond_to?(:permit!)
          return metadata.to_h if metadata.respond_to?(:to_h)

          {}
        end

        def lifecycle_profile_key!
          key = params[:profile_key].to_s.strip
          raise CurriculumProfileLifecycleService::LifecycleError, "profile_key is required" if key.blank?

          key
        end

        def lifecycle_profile_version!
          version = params[:profile_version].to_s.strip
          raise CurriculumProfileLifecycleService::LifecycleError, "profile_version is required" if version.blank?

          version
        end

        def rollback_to_version!
          version = params[:rollback_to_version].to_s.strip
          raise CurriculumProfileLifecycleService::LifecycleError, "rollback_to_version is required" if version.blank?

          version
        end

        def lifecycle_audit_metadata(operation, release)
          {
            tenant_id: Current.tenant.id,
            operation: operation,
            profile_key: release.profile_key,
            profile_version: release.profile_version,
            actor_id: Current.user.id
          }
        end
      end
    end
  end
end
