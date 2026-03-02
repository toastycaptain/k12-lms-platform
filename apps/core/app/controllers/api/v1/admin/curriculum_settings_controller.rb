module Api
  module V1
    module Admin
      class CurriculumSettingsController < ApplicationController
        def show
          authorize :curriculum_settings, :show?
          render json: settings_payload
        end

        def update
          authorize :curriculum_settings, :update?

          ActiveRecord::Base.transaction do
            apply_tenant_default!
            raise ActiveRecord::Rollback if performed?

            apply_school_overrides!
            raise ActiveRecord::Rollback if performed?
          end
          return if performed?

          audit_event(
            "curriculum.settings.updated",
            auditable: Current.tenant,
            metadata: {
              tenant_id: Current.tenant.id,
              tenant_default_profile_key: Current.tenant.settings&.dig("curriculum_default_profile_key"),
              school_override_count: Array(params[:school_overrides]).size
            }
          )

          render json: settings_payload
        end

        def import
          authorize :curriculum_settings, :update?
          audit_event(
            "curriculum.settings.import.requested",
            auditable: Current.tenant,
            metadata: {
              tenant_id: Current.tenant.id,
              requested_by_user_id: Current.user.id
            }
          )
          render json: { error: "Curriculum profile import pipeline is not yet implemented." }, status: :not_implemented
        end

        private

        def settings_payload
          {
            tenant_default_profile_key: Current.tenant.settings&.dig("curriculum_default_profile_key") || CurriculumProfileRegistry.default_profile_key,
            available_profile_keys: CurriculumProfileRegistry.keys,
            school_overrides: policy_scope(School).order(:name).map { |school|
              {
                school_id: school.id,
                school_name: school.name,
                curriculum_profile_key: school.curriculum_profile_key,
                effective_curriculum_profile_key: effective_profile_key_for(school),
                effective_curriculum_source: effective_profile_source_for(school)
              }
            }
          }
        end

        def apply_tenant_default!
          return unless params.key?(:tenant_default_profile_key)

          default_key = params[:tenant_default_profile_key].presence
          if default_key.present? && !CurriculumProfileRegistry.keys.include?(default_key)
            render json: { error: "Invalid tenant_default_profile_key" }, status: :unprocessable_content
            return
          end

          settings = (Current.tenant.settings || {}).deep_dup
          settings["curriculum_default_profile_key"] = default_key || CurriculumProfileRegistry.default_profile_key
          Current.tenant.update!(settings: settings)
        end

        def apply_school_overrides!
          school_updates = Array(params[:school_overrides])
          school_updates.each do |entry|
            school_id = entry[:school_id] || entry["school_id"]
            key = entry[:curriculum_profile_key] || entry["curriculum_profile_key"]

            school = policy_scope(School).find(school_id)
            authorize school, :update?

            if key.present? && !CurriculumProfileRegistry.keys.include?(key)
              render json: { error: "Invalid curriculum_profile_key for school_id=#{school.id}" }, status: :unprocessable_content
              return
            end

            school.update!(curriculum_profile_key: key.presence)
          end
        end

        def effective_profile_key_for(school)
          resolved = CurriculumProfileResolver.resolve(tenant: Current.tenant, school: school)
          resolved[:profile_key]
        end

        def effective_profile_source_for(school)
          resolved = CurriculumProfileResolver.resolve(tenant: Current.tenant, school: school)
          resolved[:source]
        end
      end
    end
  end
end
