module Api
  module V1
    class ApprovalsController < ApplicationController
      before_action :set_approval, only: [ :approve, :reject ]

      def index
        @approvals = policy_scope(Approval)
        @approvals = @approvals.where(status: params[:status]) if params[:status].present?
        render json: @approvals
      end

      def approve
        authorize @approval

        ActiveRecord::Base.transaction do
          @approval.approve!(reviewer: Current.user)

          # Auto-publish the unit plan
          approvable = @approval.approvable
          approvable.publish! if approvable.respond_to?(:publish!)
        end

        render json: @approval
      rescue ActiveRecord::RecordInvalid
        render json: { errors: [ "Cannot approve: approval must be in pending status" ] },
               status: :unprocessable_content
      end

      def reject
        authorize @approval
        comments = params[:comments]
        unless comments.present?
          return render json: { errors: [ "Comments are required when rejecting" ] },
                        status: :unprocessable_content
        end

        ActiveRecord::Base.transaction do
          @approval.reject!(reviewer: Current.user, comments: comments)

          # Revert unit plan status back to draft
          approvable = @approval.approvable
          approvable.update!(status: "draft") if approvable.respond_to?(:status)
        end

        render json: @approval
      rescue ActiveRecord::RecordInvalid
        render json: { errors: [ "Cannot reject: approval must be in pending status" ] },
               status: :unprocessable_content
      end

      private

      def set_approval
        @approval = Approval.includes(:approvable).find(params[:id])
      end
    end
  end
end
