module Api
  module V1
    module Ib
      class ReflectionRequestsController < BaseController
        before_action :set_request_record, only: :update

        def index
          authorize IbReflectionRequest
          requests = policy_scope(IbReflectionRequest).includes(:ib_evidence_item).order(updated_at: :desc, id: :desc)
          requests = requests.where(status: params[:status]) if params[:status].present?
          requests = requests.where(student_id: params[:student_id]) if params[:student_id].present?
          requests = requests.where(ib_evidence_item_id: params[:ib_evidence_item_id]) if params[:ib_evidence_item_id].present?
          render json: requests, each_serializer: IbReflectionRequestSerializer
        end

        def update
          authorize @request_record

          case reflection_request_params[:action].to_s
          when "respond"
            @request_record.update!(
              status: "responded",
              response_excerpt: reflection_request_params[:response_excerpt],
              responded_at: Time.current,
              metadata: merged_metadata("surface" => "mobile", "action" => "respond")
            )
          when "approve"
            @request_record.update!(
              status: "approved",
              response_excerpt: reflection_request_params[:response_excerpt].presence || @request_record.response_excerpt,
              approved_by: Current.user,
              approved_at: Time.current,
              metadata: merged_metadata("surface" => "mobile", "action" => "approve")
            )
            @request_record.ib_evidence_item.update!(status: "validated")
          when "cancel"
            @request_record.update!(
              status: "cancelled",
              metadata: merged_metadata("surface" => "mobile", "action" => "cancel")
            )
          else
            @request_record.update!(reflection_request_params.except(:action))
          end

          render json: @request_record, serializer: IbReflectionRequestSerializer
        end

        private

        def set_request_record
          @request_record = policy_scope(IbReflectionRequest).find(params[:id])
        end

        def reflection_request_params
          params.fetch(:ib_reflection_request, params).permit(:action, :response_excerpt, :due_on, metadata: {})
        end

        def merged_metadata(system_metadata)
          @request_record.metadata.to_h.merge(system_metadata).merge(reflection_request_params[:metadata].to_h)
        end
      end
    end
  end
end
