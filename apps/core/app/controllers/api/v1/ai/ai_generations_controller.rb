module Api
  module V1
    module Ai
      class AiGenerationsController < ApplicationController
        def create
          authorize :ai_generation
          invocation = AiInvocation.create!(
            tenant: Current.tenant,
            user: Current.user,
            task_type: params[:task_type],
            prompt: params[:prompt],
            status: "pending"
          )
          AiGenerateJob.perform_later(invocation.id)
          render json: { id: invocation.id, status: invocation.status }, status: :accepted
        end

        def result
          invocation = AiInvocation.find(params[:id])

          unless invocation.user == Current.user || Current.user.has_role?(:admin)
            render json: { error: "Not found" }, status: :not_found
            return
          end

          authorize invocation, :show?
          render json: {
            id: invocation.id,
            status: invocation.status,
            result: invocation.result,
            error: invocation.error_message
          }
        end
      end
    end
  end
end
