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
        @approval.approve!(reviewer: Current.user)

        # Auto-publish the unit plan
        approvable = @approval.approvable
        approvable.publish! if approvable.respond_to?(:publish!)
        NotificationService.notify(
          user: @approval.requested_by,
          event_type: "approval_resolved",
          title: "Your #{approvable.class.name.underscore.humanize.downcase} '#{approvable.respond_to?(:title) ? approvable.title : approvable.id}' was approved",
          actor: Current.user,
          notifiable: @approval,
          metadata: {
            status: "approved",
            title: approvable.respond_to?(:title) ? approvable.title : approvable.id.to_s
          }
        )
        audit_event(
          "approval.approved",
          auditable: @approval,
          metadata: {
            approvable_type: @approval.approvable_type,
            approvable_id: @approval.approvable_id
          }
        )

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

        @approval.reject!(reviewer: Current.user, comments: comments)

        # Revert unit plan status back to draft
        approvable = @approval.approvable
        approvable.update!(status: "draft") if approvable.respond_to?(:status)
        NotificationService.notify(
          user: @approval.requested_by,
          event_type: "approval_resolved",
          title: "Your #{approvable.class.name.underscore.humanize.downcase} '#{approvable.respond_to?(:title) ? approvable.title : approvable.id}' was rejected",
          actor: Current.user,
          notifiable: @approval,
          metadata: {
            status: "rejected",
            title: approvable.respond_to?(:title) ? approvable.title : approvable.id.to_s
          }
        )
        audit_event(
          "approval.rejected",
          auditable: @approval,
          metadata: {
            approvable_type: @approval.approvable_type,
            approvable_id: @approval.approvable_id
          }
        )

        render json: @approval
      rescue ActiveRecord::RecordInvalid
        render json: { errors: [ "Cannot reject: approval must be in pending status" ] },
               status: :unprocessable_content
      end

      private

      def set_approval
        @approval = Approval.find(params[:id])
      end
    end
  end
end
