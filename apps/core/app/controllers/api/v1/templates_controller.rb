module Api
  module V1
    class TemplatesController < ApplicationController
      before_action :set_template, only: [ :show, :update, :destroy, :create_version, :versions, :publish, :archive, :create_unit ]

      def index
        @templates = policy_scope(Template).includes(:template_versions)
        @templates = @templates.where(status: "published") unless current_user_can_manage_templates?
        @templates = paginate(@templates)

        if include_curriculum_defaults?
          render json: {
            templates: ActiveModelSerializers::SerializableResource.new(@templates),
            curriculum_defaults: curriculum_defaults_payload
          }
        else
          render json: @templates
        end
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
        workflow_engine.transition!(
          record: @template,
          event: :publish,
          actor: Current.user
        )
        render json: @template
      rescue *transition_error_classes => e
        render json: { errors: [ e.message ] }, status: :unprocessable_content
      end

      def archive
        authorize @template
        workflow_engine.transition!(
          record: @template,
          event: :archive,
          actor: Current.user
        )
        render json: @template
      rescue *transition_error_classes => e
        render json: { errors: [ e.message ] }, status: :unprocessable_content
      end

      def create_unit
        authorize @template
        unless @template.status == "published"
          return render json: { errors: [ "Only published templates can be used to create units" ] },
                        status: :unprocessable_content
        end

        course = Course.find(params[:course_id])
        unit_plan = @template.create_unit_from_template!(course: course, user: Current.user)
        render json: unit_plan, status: :created
      end

      private

      def set_template
        @template = Template.includes(:template_versions).find(params[:id])
        authorize @template unless %w[create_version versions publish archive create_unit].include?(action_name)
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

      def include_curriculum_defaults?
        ActiveModel::Type::Boolean.new.cast(params[:include_curriculum_defaults])
      end

      def curriculum_defaults_payload
        course = policy_scope(Course).find_by(id: params[:course_id]) if params[:course_id].present?
        resolved = CurriculumProfileResolver.resolve(
          tenant: Current.tenant,
          school: course&.school,
          course: course,
          academic_year: course&.academic_year
        )

        {
          profile_key: resolved[:profile_key],
          profile_version: resolved[:resolved_profile_version],
          template_defaults: resolved[:template_defaults],
          framework_defaults: resolved[:framework_defaults],
          selected_from: resolved[:selected_from],
          resolution_trace_id: resolved[:resolution_trace_id]
        }
      end

      def workflow_engine
        if FeatureFlag.enabled?("curriculum_pack_workflows_v1", tenant: Current.tenant)
          Curriculum::WorkflowEngine
        else
          CurriculumWorkflowEngine
        end
      end

      def transition_error_classes
        [ CurriculumWorkflowEngine::TransitionError, Curriculum::WorkflowEngine::TransitionError ]
      end
    end
  end
end
