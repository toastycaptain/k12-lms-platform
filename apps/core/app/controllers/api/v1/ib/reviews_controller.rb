module Api
  module V1
    module Ib
      class ReviewsController < BaseController
        def index
          authorize Approval, :index?, policy_class: ApprovalPolicy

          approvals = policy_scope(Approval).where(status: "pending").includes(:approvable).limit(20)
          comments = policy_scope(IbDocumentComment).open_status.limit(20)
          records = policy_scope(IbOperationalRecord).where(risk_level: %w[watch risk]).limit(20)

          render json: {
            approvals: approvals.map { |approval| approval_row(approval) },
            moderation: records.map { |record| operational_row(record) },
            comments: comments.map { |comment| comment_row(comment) }
          }
        end

        private

        def approval_row(approval)
          approvable = approval.approvable
          {
            id: "approval-#{approval.id}",
            lane: "approvals",
            item: approvable.respond_to?(:title) ? approvable.title : approval.approvable_type,
            detail: "Awaiting sign-off.",
            href: approvable.respond_to?(:id) ? ::Ib::RouteBuilder.href_for(approvable) : "/ib/review",
            entity_ref: "Approval:#{approval.id}"
          }
        end

        def operational_row(record)
          {
            id: "record-#{record.id}",
            lane: "moderation",
            item: record.title,
            detail: record.next_action.presence || record.summary.to_s.truncate(120),
            href: ::Ib::RouteBuilder.href_for(record),
            entity_ref: ::Ib::RouteBuilder.entity_ref_for(record)
          }
        end

        def comment_row(comment)
          {
            id: "comment-#{comment.id}",
            lane: "comments",
            item: comment.curriculum_document&.title || "Document comment",
            detail: comment.body.truncate(120),
            href: ::Ib::RouteBuilder.href_for(comment.curriculum_document),
            entity_ref: ::Ib::RouteBuilder.entity_ref_for(comment)
          }
        end
      end
    end
  end
end
