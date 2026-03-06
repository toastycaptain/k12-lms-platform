module Api
  module V1
    class PlanningContextsController < ApplicationController
      before_action :ensure_curriculum_documents_enabled!
      before_action :set_planning_context, only: [ :show, :update, :destroy ]

      def index
        contexts = policy_scope(PlanningContext).order(:name)
        contexts = contexts.where(school_id: params[:school_id]) if params[:school_id].present?
        contexts = contexts.where(academic_year_id: params[:academic_year_id]) if params[:academic_year_id].present?
        contexts = contexts.where(kind: params[:kind]) if params[:kind].present?
        render json: paginate(contexts)
      end

      def show
        authorize @planning_context
        render json: @planning_context
      end

      def create
        authorize PlanningContext
        school = policy_scope(School).find(context_params.fetch(:school_id))
        academic_year = policy_scope(AcademicYear).find(context_params.fetch(:academic_year_id))
        if Current.respond_to?(:school) && Current.school.present? && school.id != Current.school.id
          render json: { error: "School mismatch" }, status: :unprocessable_content
          return
        end

        context = Curriculum::PlanningContextFactory.create!(
          tenant: Current.tenant,
          created_by: Current.user,
          school: school,
          academic_year: academic_year,
          kind: context_params.fetch(:kind),
          name: context_params.fetch(:name),
          course_ids: context_params[:course_ids],
          settings: context_params[:settings] || {},
          metadata: context_params[:metadata] || {}
        )

        render json: context, status: :created
      rescue Curriculum::PlanningContextFactory::FactoryError => e
        render json: { errors: [ e.message ] }, status: :unprocessable_content
      end

      def update
        authorize @planning_context
        attrs = context_params.slice(:name, :kind, :status, :settings, :metadata)
        @planning_context.update!(attrs) if attrs.present?
        sync_courses! if context_params.key?(:course_ids)
        render json: @planning_context
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages }, status: :unprocessable_content
      rescue Curriculum::PlanningContextFactory::FactoryError => e
        render json: { errors: [ e.message ] }, status: :unprocessable_content
      end

      def destroy
        authorize @planning_context
        @planning_context.destroy!
        head :no_content
      end

      private

      def set_planning_context
        @planning_context = policy_scope(PlanningContext).find(params[:id])
      end

      def context_params
        params.require(:planning_context).permit(
          :school_id,
          :academic_year_id,
          :kind,
          :name,
          :status,
          settings: {},
          metadata: {},
          course_ids: []
        )
      end

      def sync_courses!
        course_ids = Array(context_params[:course_ids]).map(&:to_i).uniq
        courses = policy_scope(Course).where(id: course_ids)
        Curriculum::PlanningContextFactory.validate_courses!(
          tenant: Current.tenant,
          school: @planning_context.school,
          courses: courses
        )

        @planning_context.planning_context_courses.where.not(course_id: course_ids).destroy_all
        courses.each do |course|
          PlanningContextCourse.find_or_create_by!(
            tenant: Current.tenant,
            planning_context: @planning_context,
            course: course
          )
        end
      end

      def ensure_curriculum_documents_enabled!
        return if FeatureFlag.enabled?("curriculum_documents_v1", tenant: Current.tenant)

        render json: { error: "Not found" }, status: :not_found
      end
    end
  end
end
