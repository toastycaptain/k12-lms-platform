module Api
  module V1
    module Ib
      class WorkspacePreferencesController < BaseController
        def index
          authorize IbUserWorkspacePreference
          preferences = policy_scope(IbUserWorkspacePreference).order(updated_at: :desc)
          preferences = preferences.where(surface: params[:surface]) if params[:surface].present?
          preferences = preferences.where(context_key: params[:context_key]) if params[:context_key].present?
          preferences = preferences.where(preference_key: params[:preference_key]) if params[:preference_key].present?
          render json: preferences
        end

        def create
          preference = IbUserWorkspacePreference.write_value!(
            user: Current.user,
            school: current_school_scope,
            surface: preference_params.fetch(:surface),
            context_key: preference_params.fetch(:context_key),
            preference_key: preference_params.fetch(:preference_key),
            programme: preference_params[:programme],
            role: preference_params[:role],
            value: preference_params[:value] || {},
            metadata: preference_params[:metadata] || {}
          )
          authorize preference
          render json: preference, status: :ok
        end

        private

        def preference_params
          raw = params.require(:ib_user_workspace_preference)
          permitted = raw.permit(
            :surface,
            :context_key,
            :preference_key,
            :programme,
            :role,
            value: {},
            metadata: {}
          )
          {
            surface: permitted[:surface],
            context_key: permitted[:context_key],
            preference_key: permitted[:preference_key],
            programme: permitted[:programme],
            role: permitted[:role],
            value: normalize_hash_param(raw[:value]),
            metadata: normalize_hash_param(raw[:metadata])
          }
        end

        def normalize_hash_param(value)
          return value.to_unsafe_h if value.respond_to?(:to_unsafe_h)
          return value.to_h if value.respond_to?(:to_h)

          {}
        end
      end
    end
  end
end
