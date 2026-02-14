module Api
  module V1
    class SubmissionsController < ApplicationController
      before_action :set_assignment, only: [ :index, :create ]
      before_action :set_submission, only: [ :show ]

      def index
        submissions = policy_scope(Submission).where(assignment: @assignment)
        submissions = paginate(submissions)
        render json: submissions
      end

      def show
        authorize @submission
        render json: @submission
      end

      def create
        unless @assignment.status == "published"
          render json: { error: "Assignment is not published" }, status: :unprocessable_entity
          return
        end
        if @assignment.lock_at.present? && Time.current > @assignment.lock_at
          render json: { error: "Assignment is locked" }, status: :unprocessable_entity
          return
        end

        @submission = @assignment.submissions.build(submission_params)
        @submission.tenant = Current.tenant
        @submission.user = Current.user
        @submission.status = "submitted"
        @submission.submitted_at = Time.current
        authorize @submission
        if @submission.save
          render json: @submission, status: :created
        else
          render json: { errors: @submission.errors.full_messages }, status: :unprocessable_content
        end
      end

      private

      def set_assignment
        @assignment = Assignment.find(params[:assignment_id])
      end

      def set_submission
        @submission = Submission.find(params[:id])
      end

      def submission_params
        params.permit(:submission_type, :body, :url, :attachment)
      end
    end
  end
end
