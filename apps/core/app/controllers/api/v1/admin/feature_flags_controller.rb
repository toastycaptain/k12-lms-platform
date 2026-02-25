module Api
  module V1
    module Admin
      class FeatureFlagsController < ApplicationController
        def index
          authorize :feature_flag, :index?
          scope = policy_scope(FeatureFlag)
          overrides = scope.where(tenant_id: [ nil, Current.tenant.id ]).index_by(&:key)

          payload = FeatureFlag::DEFAULTS.map do |key, default_value|
            override = overrides[key]
            {
              key: key,
              enabled: FeatureFlag.enabled?(key, tenant: Current.tenant),
              default_enabled: default_value,
              source: override&.tenant_id == Current.tenant.id ? "tenant_override" : (override ? "global_override" : "default")
            }
          end

          render json: payload
        end

        def update
          authorize :feature_flag, :manage?
          flag = FeatureFlag.find_or_initialize_by(key: params[:key], tenant: Current.tenant)
          flag.enabled = ActiveModel::Type::Boolean.new.cast(params[:enabled])
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
      end
    end
  end
end
