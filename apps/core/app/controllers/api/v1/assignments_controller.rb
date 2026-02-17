module Api
  module V1
    class AssignmentsController < ApplicationController
      before_action :set_course, only: [ :create ]
      before_action :set_assignment, only: [ :show, :update, :destroy, :publish, :close, :push_to_classroom, :sync_grades ]

      def index
        assignments = policy_scope(Assignment).includes(:submissions, :resource_links, :rubric)
        assignments = assignments.where(course_id: params[:course_id]) if params[:course_id].present?
        assignments = assignments.where(status: params[:status]) if params[:status].present?
        assignments = paginate(assignments)
        render json: assignments
      end

      def show
        authorize @assignment
        render json: @assignment
      end

      def create
        @assignment = @course.assignments.build(assignment_params)
        @assignment.tenant = Current.tenant
        @assignment.created_by = Current.user
        authorize @assignment
        if @assignment.save
          render json: @assignment, status: :created
        else
          render json: { errors: @assignment.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        authorize @assignment
        if @assignment.update(assignment_params)
          render json: @assignment
        else
          render json: { errors: @assignment.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @assignment
        @assignment.destroy!
        head :no_content
      end

      def publish
        authorize @assignment
        @assignment.publish!
        NotificationService.notify_enrolled_students(
          course: @assignment.course,
          type: "assignment_published",
          title: "New assignment: #{@assignment.title}",
          url: "/learn/courses/#{@assignment.course_id}/assignments/#{@assignment.id}",
          actor: Current.user,
          notifiable: @assignment
        )
        render json: @assignment
      rescue ActiveRecord::RecordInvalid
        render json: { error: "Cannot publish from current status" }, status: :unprocessable_content
      end

      def close
        authorize @assignment
        @assignment.close!
        render json: @assignment
      rescue ActiveRecord::RecordInvalid
        render json: { error: "Cannot close from current status" }, status: :unprocessable_content
      end

      def push_to_classroom
        authorize @assignment
        unless @assignment.status == "published"
          render json: { error: "Assignment must be published" }, status: :unprocessable_content
          return
        end

        config = IntegrationConfig.find_by!(provider: "google_classroom", status: "active")
        ClassroomCourseworkPushJob.perform_later(config.id, Current.user.id, @assignment.id)
        render json: { message: "Push to Classroom triggered" }, status: :accepted
      end

      def sync_grades
        authorize @assignment
        config = IntegrationConfig.find_by!(provider: "google_classroom", status: "active")
        coursework_mapping = SyncMapping.find_local(config, "Assignment", @assignment.id)

        unless coursework_mapping
          render json: { error: "Assignment has no Classroom coursework mapping" }, status: :unprocessable_content
          return
        end

        ClassroomGradePassbackJob.perform_later(config.id, Current.user.id, @assignment.id)
        render json: { message: "Grade sync triggered" }, status: :accepted
      end

      private

      def set_course
        @course = Course.find(params[:course_id])
      end

      def set_assignment
        @assignment = Assignment.includes(:submissions, :resource_links, :rubric).find(params[:id])
      end

      def assignment_params
        params.permit(:title, :description, :instructions, :assignment_type,
          :points_possible, :due_at, :unlock_at, :lock_at, :allow_late_submission,
          :rubric_id, submission_types: [])
      end
    end
  end
end
