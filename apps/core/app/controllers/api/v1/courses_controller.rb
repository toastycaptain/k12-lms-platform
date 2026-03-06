module Api
  module V1
    class CoursesController < ApplicationController
      before_action :set_course, only: [ :show, :update, :destroy ]

      def index
        @courses = paginate(
          policy_scope(Course)
            .includes(:school, :sections, :academic_year, :course_modules)
            .order(:name)
        )
        render json: @courses
      end

      def show
        render json: @course
      end

      def create
        @course = Course.new(course_params)
        authorize @course
        apply_current_school_to_course!(@course)
        return if performed?

        if @course.save
          CurriculumProfileResolver.invalidate_cache!(tenant: Current.tenant)
          enqueue_course_folder_if_requested(@course)
          render json: @course, status: :created
        else
          render json: { errors: @course.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        apply_current_school_to_course!(@course, proposed_school_id: course_params[:school_id])
        return if performed?

        if @course.update(course_params)
          CurriculumProfileResolver.invalidate_cache!(tenant: Current.tenant)
          render json: @course
        else
          render json: { errors: @course.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        @course.destroy!
        CurriculumProfileResolver.invalidate_cache!(tenant: Current.tenant)
        head :no_content
      end

      private

      def set_course
        @course = policy_scope(Course).includes(:school, :sections, :academic_year, :course_modules).find(params[:id])
        authorize @course
      end

      def course_params
        permitted = [ :academic_year_id, :name, :code, :description ]
        if Current.user&.has_role?(:admin)
          permitted << :school_id
          permitted << { settings: [ :curriculum_profile_key, :curriculum_profile_version ] }
        end
        params.require(:course).permit(*permitted)
      end

      def enqueue_course_folder_if_requested(course)
        return unless ActiveModel::Type::Boolean.new.cast(params[:create_drive_folder])
        return unless Current.user&.google_connected?

        CreateCourseFolderJob.perform_later(course.id, Current.user.id)
      end

      def apply_current_school_to_course!(course, proposed_school_id: nil)
        return unless Current.respond_to?(:school) && Current.school.present?

        school_id = proposed_school_id.presence&.to_i || course.school_id || Current.school.id
        if school_id != Current.school.id
          render json: { error: "School mismatch" }, status: :unprocessable_content
          return
        end

        course.school_id = Current.school.id
      end
    end
  end
end
