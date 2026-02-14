module Api
  module V1
    module Lti
      class AgsController < ApplicationController
        skip_before_action :authenticate_user!

        private def skip_authorization? = true

        before_action :validate_lti_token

        def line_items
          assignments = Assignment.where(course_id: params[:course_id])
          render json: assignments.map { |a|
            {
              id: api_v1_lti_ags_line_item_url(a.id),
              scoreMaximum: a.points_possible,
              label: a.title,
              resourceId: a.id
            }
          }
        end

        def scores
          assignment = Assignment.find(params[:line_item_id])
          render json: assignment.submissions.map { |s|
            {
              userId: s.user_id,
              scoreGiven: s.score,
              scoreMaximum: assignment.points_possible,
              activityProgress: "Completed",
              gradingProgress: s.graded_at.present? ? "FullyGraded" : "Pending"
            }
          }
        end

        def create_score
          assignment = Assignment.find(params[:line_item_id])
          submission = assignment.submissions.find_or_initialize_by(user_id: params[:userId])
          submission.tenant = Current.tenant
          submission.score = params[:scoreGiven]
          submission.graded_at = Time.current if params[:gradingProgress] == "FullyGraded"
          submission.save!
          render json: { status: "ok" }, status: :ok
        end

        private

        def validate_lti_token
          token = request.headers["Authorization"]&.split(" ")&.last
          unless token
            render json: { error: "Unauthorized" }, status: :unauthorized
            return
          end

          begin
            decoded = JWT.decode(token, nil, false).first
            client_id = decoded["aud"]
            registration = LtiRegistration.find_by!(client_id: client_id)
            Current.tenant = registration.tenant

            # Verify signature with registration's public key
            JWT.decode(token, registration.public_key, true, algorithm: "RS256")
          rescue JWT::DecodeError, ActiveRecord::RecordNotFound => e
            render json: { error: "Unauthorized" }, status: :unauthorized
          end
        end
      end
    end
  end
end
