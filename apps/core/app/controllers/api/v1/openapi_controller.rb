require "yaml"

module Api
  module V1
    class OpenapiController < ApplicationController
      skip_before_action :authenticate_user!, only: :show, if: :public_openapi_enabled?
      before_action :authorize_openapi_access!, unless: :public_openapi_enabled?

      def show
        spec_path = resolve_spec_path
        unless spec_path
          return render json: { error: "OpenAPI spec not found" }, status: :not_found
        end

        raw = spec_path.read
        parsed = YAML.safe_load(raw, aliases: true)

        render json: parsed
      rescue Psych::SyntaxError => e
        render json: { error: "OpenAPI spec is invalid", details: e.message }, status: :unprocessable_entity
      end

      private

      def authorize_openapi_access!
        authenticate_user!
        return if performed?
        return if Current.user&.has_role?(:admin) || Current.user&.has_role?(:curriculum_lead)

        render json: { error: "Forbidden" }, status: :forbidden
      end

      def resolve_spec_path
        [
          Rails.root.join("config/openapi/core-v1.openapi.yaml"),
          Rails.root.join("../../packages/contracts/core-v1.openapi.yaml").expand_path
        ].find(&:exist?)
      end

      def public_openapi_enabled?
        default_public = !Rails.env.production?
        raw = ENV.fetch("OPENAPI_PUBLIC", default_public.to_s)
        ActiveModel::Type::Boolean.new.cast(raw)
      end

      def skip_authorization?
        true
      end
    end
  end
end
