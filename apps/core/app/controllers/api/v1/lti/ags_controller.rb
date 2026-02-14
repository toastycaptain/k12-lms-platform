module Api
  module V1
    module Lti
      class AgsController < ApplicationController
        skip_before_action :authenticate_user!
        before_action :validate_lti_token

        def index_lineitems
          assignments = Assignment.unscoped.where(tenant_id: @token_payload["tenant_id"])
          line_items = assignments.map { |a| LtiAgsService.assignment_to_line_item(a) }
          render json: line_items
        end

        def create_lineitem
          Current.tenant = Tenant.find(@token_payload["tenant_id"])
          assignment = Assignment.new(
            tenant: Current.tenant,
            title: params[:label],
            points_possible: params[:scoreMaximum],
            assignment_type: "written",
            status: "published",
            course_id: params[:course_id],
            created_by_id: params[:created_by_id]
          )
          if assignment.save
            render json: LtiAgsService.assignment_to_line_item(assignment), status: :created
          else
            render json: { errors: assignment.errors.full_messages }, status: :unprocessable_content
          end
        ensure
          Current.tenant = nil
        end

        def show_lineitem
          assignment = Assignment.unscoped.find(params[:id])
          render json: LtiAgsService.assignment_to_line_item(assignment)
        end

        def results
          assignment = Assignment.unscoped.find(params[:id])
          submissions = Submission.unscoped.where(assignment: assignment)
          result_data = submissions.map do |s|
            {
              id: s.id,
              scoreOf: assignment.id,
              userId: s.user_id.to_s,
              resultScore: s.grade.to_f,
              resultMaximum: assignment.points_possible.to_f,
              comment: s.feedback
            }
          end
          render json: result_data
        end

        def scores
          assignment = Assignment.unscoped.find(params[:id])
          Current.tenant = Tenant.find(assignment.tenant_id)
          submission = LtiAgsService.post_score(
            assignment,
            params[:userId],
            { scoreGiven: params[:scoreGiven] }
          )
          render json: { resultUrl: "/api/v1/lti/ags/lineitems/#{assignment.id}/results/#{submission.id}" }, status: :created
        ensure
          Current.tenant = nil
        end

        private

        def validate_lti_token
          payload = LtiAgsService.validate_access_token(request.headers["Authorization"])
          unless payload
            render json: { error: "Invalid or missing LTI access token" }, status: :unauthorized
            return
          end
          @token_payload = payload
        end

        def skip_authorization?
          true
        end
      end
    end
  end
end
