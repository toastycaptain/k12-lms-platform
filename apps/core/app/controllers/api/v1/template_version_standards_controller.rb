module Api
  module V1
    class TemplateVersionStandardsController < ApplicationController
      before_action :set_template_version

      def index
        standards = policy_scope(Standard).where(id: @template_version.standard_ids)
        render json: standards
      end

      def create
        authorize @template_version, :update?, policy_class: TemplateVersionPolicy
        standard = Standard.find(params[:standard_id])
        tvs = @template_version.template_version_standards.create!(
          tenant: Current.tenant,
          standard: standard
        )
        render json: tvs.standard, status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages }, status: :unprocessable_content
      end

      def destroy
        authorize @template_version, :update?, policy_class: TemplateVersionPolicy
        tvs = @template_version.template_version_standards.find_by!(standard_id: params[:id])
        tvs.destroy!
        head :no_content
      end

      private

      def set_template_version
        @template_version = TemplateVersion.find(params[:template_version_id])
      end
    end
  end
end
