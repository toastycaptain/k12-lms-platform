module Api
  module V1
    class StandardsController < ApplicationController
      before_action :set_standard, only: [ :show, :update, :destroy ]
      CACHE_TTL = 1.hour

      def index
        standards_scope = policy_scope(Standard).includes(:standard_framework)
        standards_scope = standards_scope.where(standard_framework_id: params[:standard_framework_id]) if params[:standard_framework_id].present?
        @standards = cached_standards(standards_scope)

        if include_curriculum_defaults?
          render json: {
            standards: ActiveModelSerializers::SerializableResource.new(@standards),
            curriculum_defaults: curriculum_defaults_payload
          }
        else
          render json: @standards
        end
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

      def include_curriculum_defaults?
        ActiveModel::Type::Boolean.new.cast(params[:include_curriculum_defaults])
      end

      def curriculum_defaults_payload
        resolved = CurriculumProfileResolver.resolve(
          tenant: Current.tenant,
          school: default_school,
          course: default_course,
          academic_year: default_course&.academic_year
        )

        {
          profile_key: resolved[:profile_key],
          profile_version: resolved[:resolved_profile_version],
          framework_defaults: resolved[:framework_defaults],
          report_blocks: resolved.dig(:report_bindings, "standards_coverage") || {},
          selected_from: resolved[:selected_from],
          resolution_trace_id: resolved[:resolution_trace_id]
        }
      end

      def default_course
        @default_course ||= begin
          course_id = params[:course_id]
          if course_id.present?
            policy_scope(Course).find_by(id: course_id)
          end
        end
      end

      def default_school
        return default_course.school if default_course&.school

        school_id = params[:school_id]
        school_id.present? ? policy_scope(School).find_by(id: school_id) : nil
      end
    end
  end
end
