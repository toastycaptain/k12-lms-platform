module Api
  module V1
    class SubmissionsController < ApplicationController
      before_action :set_assignment, only: [ :index, :create ], if: -> { params[:assignment_id].present? }
      before_action :set_submission, only: [ :show, :update ]

      def index
        submissions = policy_scope(Submission).includes(:user, :graded_by, :assignment)
        submissions = submissions.where(assignment: @assignment) if @assignment.present?
        submissions = submissions.where(status: params[:status]) if params[:status].present?
        submissions = submissions.where(assignment_id: params[:assignment_id]) if params[:assignment_id].present?
        submissions = paginate(submissions.order(:submitted_at))
        render json: submissions
      end

      def show
        authorize @submission
        render json: @submission
      end

      def update
        authorize @submission, :grade?
        previous_status = @submission.status

        params_for_update = submission_update_params
        requested_status = params_for_update[:status]
        if requested_status.present? && !%w[graded returned].include?(requested_status)
          render json: { error: "Unsupported status transition" }, status: :unprocessable_content
          return
        end

        attrs = {}
        grade_value = params_for_update[:grade]
        rubric_scores = Array(params_for_update[:rubric_scores])

        ActiveRecord::Base.transaction do
          if rubric_scores.present?
            rubric_scores.each do |score_data|
              criterion_id = score_data[:criterion_id] || score_data[:rubric_criterion_id]
              next if criterion_id.blank?

              score = @submission.rubric_scores.find_or_initialize_by(rubric_criterion_id: criterion_id)
              score.tenant = Current.tenant
              score.rubric_rating_id = score_data[:rating_id] || score_data[:rubric_rating_id]
              score.points_awarded = score_data[:score] || score_data[:points_awarded] || 0
              score.comments = score_data[:comments]
              score.save!
            end

            grade_value = rubric_scores.sum { |score_data|
              (score_data[:score] || score_data[:points_awarded] || 0).to_d
            } if grade_value.blank?
          end

          if grade_value.present?
            grade_decimal = grade_value.to_d
            if grade_decimal.negative?
              render json: { error: "Grade must be >= 0" }, status: :unprocessable_content
              raise ActiveRecord::Rollback
            end
            if @submission.assignment.points_possible.present? && grade_decimal > @submission.assignment.points_possible
              render json: { error: "Grade cannot exceed points possible" }, status: :unprocessable_content
              raise ActiveRecord::Rollback
            end

            attrs[:grade] = grade_decimal
            attrs[:status] = "graded"
            attrs[:graded_at] = Time.current
            attrs[:graded_by] = Current.user
          end

          attrs[:feedback] = params_for_update[:feedback] if params_for_update.key?(:feedback)

          if requested_status == "returned"
            unless @submission.status == "graded" || attrs[:status] == "graded"
              render json: { error: "Can only return graded submissions" }, status: :unprocessable_content
              raise ActiveRecord::Rollback
            end
            attrs[:status] = "returned"
          elsif requested_status == "graded" && attrs[:status].blank?
            attrs[:status] = "graded"
            attrs[:graded_at] = Time.current
            attrs[:graded_by] = Current.user
          end

          @submission.update!(attrs) if attrs.present?
        end

        return if performed?

        if previous_status != @submission.status && %w[graded returned].include?(@submission.status)
          NotificationService.notify(
            user: @submission.user,
            event_type: "assignment_graded",
            title: "Grade posted: #{@submission.assignment.title}",
            url: "/learn/courses/#{@submission.assignment.course_id}/assignments/#{@submission.assignment_id}",
            actor: Current.user,
            notifiable: @submission,
            metadata: {
              assignment_id: @submission.assignment_id,
              assignment_title: @submission.assignment.title
            }
          )
        end

        render json: @submission
      rescue ActiveRecord::RecordInvalid
        render json: { errors: @submission.errors.full_messages }, status: :unprocessable_content
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

        @submission = @assignment.submissions.find_or_initialize_by(user: Current.user)
        if @submission.persisted? && @submission.status != "missing"
          authorize @submission
          render json: { errors: [ "User already has a submission for this assignment" ] }, status: :unprocessable_content
          return
        end

        @submission.assign_attributes(submission_params)
        @submission.tenant ||= Current.tenant
        @submission.status = "submitted"
        @submission.submitted_at = Time.current
        authorize @submission
        if @submission.save
          notify_submission_received!(@submission)
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
        @submission = Submission.includes(:user, :graded_by, :assignment).find(params[:id])
      end

      def submission_params
        params.permit(:submission_type, :body, :url, :attachment)
      end

      def submission_update_params
        params.permit(
          :grade,
          :feedback,
          :status,
          rubric_scores: [ :criterion_id, :rating_id, :score, :comments, :rubric_criterion_id, :rubric_rating_id, :points_awarded ]
        )
      end

      def notify_submission_received!(submission)
        teacher_ids = Enrollment.joins(:section)
                                .where(role: "teacher", sections: { course_id: submission.assignment.course_id })
                                .distinct
                                .pluck(:user_id)

        User.where(id: teacher_ids).find_each do |teacher|
          NotificationService.notify(
            user: teacher,
            event_type: "submission_received",
            title: "New submission received",
            message: "#{submission.user.first_name} #{submission.user.last_name} submitted #{submission.assignment.title}",
            url: "/learn/courses/#{submission.assignment.course_id}/assignments/#{submission.assignment_id}",
            actor: submission.user,
            notifiable: submission,
            metadata: {
              assignment_id: submission.assignment_id,
              assignment_title: submission.assignment.title,
              student_name: "#{submission.user.first_name} #{submission.user.last_name}".strip
            }
          )
        end
      end
    end
  end
end
