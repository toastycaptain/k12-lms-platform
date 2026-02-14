module Api
  module V1
    class RubricScoresController < ApplicationController
      before_action :set_submission

      def index
        scores = policy_scope(RubricScore).where(submission: @submission)
        render json: scores
      end

      def create
        authorize RubricScore.new(tenant: Current.tenant)
        scores_params = params[:scores] || []
        total_grade = nil

        saved_scores = ActiveRecord::Base.transaction do
          scores = scores_params.map do |score_data|
            score = @submission.rubric_scores.find_or_initialize_by(
              rubric_criterion_id: score_data[:rubric_criterion_id]
            )
            score.tenant = Current.tenant
            score.rubric_rating_id = score_data[:rubric_rating_id]
            score.points_awarded = score_data[:points_awarded]
            score.comments = score_data[:comments]
            score.save!
            score
          end

          # Auto-calculate total grade from rubric scores sum
          total_grade = @submission.rubric_scores.reload.sum(:points_awarded)
          @submission.update!(
            grade: total_grade,
            status: "graded",
            graded_at: Time.current,
            graded_by: Current.user
          )

          scores
        end

        audit_event(
          "rubric_scores.applied",
          auditable: @submission,
          metadata: {
            rubric_score_count: saved_scores.length,
            total_grade: total_grade.to_s
          }
        )
        render json: saved_scores, status: :created
      end

      private

      def set_submission
        @submission = Submission.find(params[:submission_id])
      end
    end
  end
end
