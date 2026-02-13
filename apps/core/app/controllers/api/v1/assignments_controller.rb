module Api
  module V1
    class AssignmentsController < ApplicationController
      before_action :set_course, only: [ :index, :create ]
      before_action :set_assignment, only: [ :show, :update, :destroy, :publish, :close ]

      def index
        assignments = policy_scope(Assignment).where(course: @course)
        assignments = assignments.where(status: params[:status]) if params[:status].present?
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

      private

      def set_course
        @course = Course.find(params[:course_id])
      end

      def set_assignment
        @assignment = Assignment.find(params[:id])
      end

      def assignment_params
        params.permit(:title, :description, :instructions, :assignment_type,
          :points_possible, :due_at, :unlock_at, :lock_at, :allow_late_submission,
          :rubric_id, submission_types: [])
      end
    end
  end
end
