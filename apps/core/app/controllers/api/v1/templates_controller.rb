module Api
  module V1
    class TemplatesController < ApplicationController
      before_action :set_template, only: [ :show, :update, :destroy, :create_version, :versions, :publish, :archive ]

      def index
        @templates = policy_scope(Template)
        @templates = @templates.where(status: "published") unless current_user_can_manage_templates?
        render json: @templates
      end

      def show
        render json: @template
      end

      def create
        @template = Template.new(template_params)
        @template.created_by = Current.user
        authorize @template

        if @template.save
          @template.create_version!(title: @template.name)
          render json: @template, status: :created
        else
          render json: { errors: @template.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        if @template.update(template_params)
          render json: @template
        else
          render json: { errors: @template.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        @template.destroy!
        head :no_content
      end

      def create_version
        authorize @template
        version = @template.create_version!(version_params)
        render json: version, status: :created
      end

      def versions
        authorize @template, :show?
        render json: @template.template_versions.order(version_number: :desc)
      end

      def publish
        authorize @template
        @template.publish!
        render json: @template
      rescue ActiveRecord::RecordInvalid
        render json: { errors: [ "Cannot publish: template must be in draft status with a current version" ] },
               status: :unprocessable_content
      end

      def archive
        authorize @template
        @template.archive!
        render json: @template
      rescue ActiveRecord::RecordInvalid
        render json: { errors: [ "Cannot archive: template must be in published status" ] },
               status: :unprocessable_content
      end

      private

      def set_template
        @template = Template.find(params[:id])
        authorize @template unless %w[create_version versions publish archive].include?(action_name)
      end

      def template_params
        params.require(:template).permit(:name, :subject, :grade_level, :description, :status)
      end

      def version_params
        params.require(:version).permit(:title, :description, :suggested_duration_weeks,
                                        essential_questions: [], enduring_understandings: [])
      end

      def current_user_can_manage_templates?
        Current.user&.has_role?(:admin) || Current.user&.has_role?(:curriculum_lead)
      end
    end
  end
end
