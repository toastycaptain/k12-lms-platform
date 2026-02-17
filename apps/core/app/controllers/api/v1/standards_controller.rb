module Api
  module V1
    class StandardsController < ApplicationController
      before_action :set_standard, only: [ :show, :update, :destroy ]
      CACHE_TTL = 1.hour

      def index
        standards_scope = policy_scope(Standard).includes(:standard_framework)
        standards_scope = standards_scope.where(standard_framework_id: params[:standard_framework_id]) if params[:standard_framework_id].present?
        @standards = cached_standards(standards_scope)
        render json: @standards
      end

      def show
        render json: @standard
      end

      def tree
        framework = StandardFramework.find(params[:id])
        authorize framework, :show?

        roots = Standard.where(standard_framework_id: framework.id).roots.includes(:children)
        render json: roots.map(&:tree)
      end

      def create
        @standard = Standard.new(standard_params)
        authorize @standard

        if @standard.save
          render json: @standard, status: :created
        else
          render json: { errors: @standard.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        if @standard.update(standard_params)
          render json: @standard
        else
          render json: { errors: @standard.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        @standard.destroy!
        head :no_content
      end

      private

      def set_standard
        @standard = Standard.includes(:standard_framework).find(params[:id])
        authorize @standard
      end

      def standard_params
        params.require(:standard).permit(:standard_framework_id, :parent_id, :code, :description, :grade_band)
      end

      def cached_standards(scope)
        tenant_id = Current.tenant&.id
        return scope.to_a if tenant_id.blank?

        framework_key = params[:standard_framework_id].presence || "all"
        Rails.cache.fetch("tenant:#{tenant_id}:standards:#{framework_key}", expires_in: CACHE_TTL) do
          scope.to_a
        end
      end
    end
  end
end
