module Api
  module V1
    class SubmissionGradingController < ApplicationController
      before_action :set_submission, only: [ :grade, :return_submission ]

      def grade
        authorize @submission, :grade?
        grade_val = params[:grade].to_d
        if @submission.assignment.points_possible.present? && grade_val > @submission.assignment.points_possible
          render json: { error: "Grade cannot exceed points possible" }, status: :unprocessable_content
          return
        end
        if grade_val < 0
          render json: { error: "Grade must be >= 0" }, status: :unprocessable_content
          return
        end

        @submission.update!(
          grade: grade_val,
          feedback: params[:feedback],
          status: "graded",
          graded_at: Time.current,
          graded_by: Current.user
        )
        NotificationService.notify(
          user: @submission.user,
          event_type: "assignment_graded",
          title: "Grade posted: #{@submission.assignment.title}",
          message: "Your submission was graded.",
          url: "/learn/courses/#{@submission.assignment.course_id}/assignments/#{@submission.assignment_id}",
          actor: Current.user,
          notifiable: @submission,
          metadata: {
            assignment_id: @submission.assignment_id,
            assignment_title: @submission.assignment.title
          }
        )
        audit_event(
          "submission.graded",
          auditable: @submission,
          metadata: {
            assignment_id: @submission.assignment_id,
            grade: grade_val.to_s
          }
        )
        render json: @submission
      end

      def return_submission
        authorize @submission, :grade?
        unless @submission.status == "graded"
          render json: { error: "Can only return graded submissions" }, status: :unprocessable_content
          return
        end

        @submission.update!(status: "returned")
        audit_event(
          "submission.returned",
          auditable: @submission,
          metadata: { assignment_id: @submission.assignment_id }
        )
        render json: @submission
      end

      private

      def set_submission
        @submission = Submission.find(params[:id])
      end
    end
  end
end
