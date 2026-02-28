require "yaml"

module Api
  module V1
    class OpenapiController < ApplicationController
      skip_before_action :authenticate_user!

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

      def resolve_spec_path
        [
          Rails.root.join("config/openapi/core-v1.openapi.yaml"),
          Rails.root.join("../../packages/contracts/core-v1.openapi.yaml").expand_path
        ].find(&:exist?)
      end

      def skip_authorization?
        true
      end
    end
  end
end
