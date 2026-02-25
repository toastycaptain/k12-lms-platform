require "yaml"

module Api
  module V1
    class OpenapiController < ApplicationController
      skip_before_action :authenticate_user!

      def show
        spec_path = Rails.root.join("../../packages/contracts/core-v1.openapi.yaml").expand_path
        raw = spec_path.read
        parsed = YAML.safe_load(raw, aliases: true)

        render json: parsed
      rescue Errno::ENOENT
        render json: { error: "OpenAPI spec not found" }, status: :not_found
      rescue Psych::SyntaxError => e
        render json: { error: "OpenAPI spec is invalid", details: e.message }, status: :unprocessable_entity
      end

      private

      def skip_authorization?
        true
      end
    end
  end
end
