module Api
  module V1
    module Admin
      class FeatureFlagsController < ApplicationController
        FLAG_DEPENDENCIES = {
          "curriculum_pack_lifecycle_v1" => [ "curriculum_profiles_v2_core" ],
          "curriculum_profile_version_pinning_v1" => [ "curriculum_profiles_v2_core" ],
          "curriculum_resolution_observability_v1" => [ "curriculum_profiles_v2_core" ],
          "planner_schema_renderer_v1" => [ "curriculum_profiles_v2_core" ],
          "runtime_nav_composition_v1" => [ "curriculum_profiles_v2_core" ],
          "profile_derived_surfaces_v1" => [ "curriculum_profiles_v2_core" ],
          "curriculum_workflow_engine_v1" => [ "curriculum_profiles_v2_core" ],
          "district_curriculum_governance_v1" => [ "curriculum_profiles_v2_core" ],
          "integration_curriculum_envelope_v1" => [ "curriculum_profiles_v2_core" ],
          "curriculum_security_derived_only_v1" => [ "curriculum_profiles_v2_core" ]
        }.freeze

        def index
          authorize :feature_flag, :index?
          scope = policy_scope(FeatureFlag)
          overrides = scope.where(tenant_id: [ nil, Current.tenant.id ]).index_by(&:key)

          payload = FeatureFlag::DEFAULTS.map do |key, default_value|
            override = overrides[key]
            requires = FLAG_DEPENDENCIES.fetch(key, [])

            {
              key: key,
              enabled: FeatureFlag.enabled?(key, tenant: Current.tenant),
              default_enabled: default_value,
              source: override&.tenant_id == Current.tenant.id ? "tenant_override" : (override ? "global_override" : "default"),
              requires: requires,
              blocked_by: requires.reject { |dep_key| FeatureFlag.enabled?(dep_key, tenant: Current.tenant) }
            }
          end

          render json: payload
        end

        def update
          authorize :feature_flag, :manage?

          target_tenant_ids = Array(params[:target_tenant_ids]).map(&:to_i).uniq
          if target_tenant_ids.present?
            execute_rollout_update(target_tenant_ids)
            return
          end

          desired_enabled = ActiveModel::Type::Boolean.new.cast(params[:enabled])
          dependency_error = dependency_block_error_for(params[:key], desired_enabled, tenant: Current.tenant)
          if dependency_error
            render json: { error: dependency_error }, status: :unprocessable_content
            return
          end

          flag = FeatureFlag.find_or_initialize_by(key: params[:key], tenant: Current.tenant)
          flag.enabled = desired_enabled
          flag.save!

          render json: {
            key: flag.key,
            enabled: flag.enabled,
            source: "tenant_override"
          }
        end

        def destroy
          authorize :feature_flag, :manage?
          FeatureFlag.find_by(key: params[:key], tenant: Current.tenant)&.destroy!
          render json: { key: params[:key], removed: true }
        end

        private

        def execute_rollout_update(target_tenant_ids)
          desired_enabled = ActiveModel::Type::Boolean.new.cast(params[:enabled])
          allowed_ids = Tenant.unscoped.where(id: target_tenant_ids).pluck(:id)

          results = allowed_ids.map do |tenant_id|
            tenant = Tenant.unscoped.find(tenant_id)
            error = dependency_block_error_for(params[:key], desired_enabled, tenant: tenant)

            if error
              { tenant_id: tenant_id, status: "blocked", error: error }
            else
              flag = FeatureFlag.find_or_initialize_by(key: params[:key], tenant_id: tenant_id)
              flag.enabled = desired_enabled
              flag.save!
              { tenant_id: tenant_id, status: desired_enabled ? "enabled" : "disabled" }
            end
          end

          render json: {
            key: params[:key],
            mode: desired_enabled ? "enable" : "disable",
            executed: results.count { |row| row[:status] == "enabled" || row[:status] == "disabled" },
            failed: results.count { |row| row[:status] == "blocked" },
            results: results
          }
        end

        def dependency_block_error_for(key, desired_enabled, tenant:)
          return nil unless desired_enabled

          missing = FLAG_DEPENDENCIES.fetch(key.to_s, []).reject { |dep| FeatureFlag.enabled?(dep, tenant: tenant) }
          return nil if missing.empty?

          "Cannot enable #{key}: missing required flags #{missing.join(', ')}"
        end
      end
    end
  end
end
