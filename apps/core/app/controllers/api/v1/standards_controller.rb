module Api
  module V1
    class StandardsController < ApplicationController
      before_action :set_standard, only: [ :show, :update, :destroy ]

      def index
        @standards = policy_scope(Standard)
        @standards = @standards.where(standard_framework_id: params[:standard_framework_id]) if params[:standard_framework_id]
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
        @standard = Standard.find(params[:id])
        authorize @standard
      end

      def standard_params
        params.require(:standard).permit(:standard_framework_id, :parent_id, :code, :description, :grade_band)
      end
    end
  end
end
