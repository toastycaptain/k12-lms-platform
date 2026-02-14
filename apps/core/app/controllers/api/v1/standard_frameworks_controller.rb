module Api
  module V1
    class StandardFrameworksController < ApplicationController
      before_action :set_standard_framework, only: [ :show, :update, :destroy ]

      def index
        @standard_frameworks = policy_scope(StandardFramework)
        render json: @standard_frameworks
      end

      def show
        render json: @standard_framework
      end

      def create
        @standard_framework = StandardFramework.new(standard_framework_params)
        authorize @standard_framework

        if @standard_framework.save
          render json: @standard_framework, status: :created
        else
          render json: { errors: @standard_framework.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        if @standard_framework.update(standard_framework_params)
          render json: @standard_framework
        else
          render json: { errors: @standard_framework.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        @standard_framework.destroy!
        head :no_content
      end

      private

      def set_standard_framework
        @standard_framework = StandardFramework.find(params[:id])
        authorize @standard_framework
      end

      def standard_framework_params
        params.require(:standard_framework).permit(:name, :jurisdiction, :subject, :version)
      end
    end
  end
end
