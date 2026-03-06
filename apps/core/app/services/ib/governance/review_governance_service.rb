module Ib
  module Governance
    class ReviewGovernanceService
      def initialize(tenant:, school: nil)
        @tenant = tenant
        @school = school
      end

      def build
        {
          summary_metrics: summary_metrics,
          queues: {
            approvals: approvals_queue,
            moderation: moderation_queue,
            returned: returned_queue,
            orphaned: orphaned_queue,
            sla_breaches: sla_breaches
          },
          generated_at: Time.current.utc.iso8601
        }
      end

      private

      attr_reader :tenant, :school

      def scoped_approvals
        Approval.pending
          .includes(:approvable)
          .select do |approval|
            approvable = approval.approvable
            next false if approvable.nil?

            same_tenant =
              !approvable.respond_to?(:tenant_id) ||
              approvable.tenant_id.blank? ||
              approvable.tenant_id == tenant.id
            same_school =
              school.nil? ||
              !approvable.respond_to?(:school_id) ||
              approvable.school_id.blank? ||
              approvable.school_id == school.id

            same_tenant && same_school
          end
      end

      def scoped_documents
        scope = CurriculumDocument.where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school
        scope
      end

      def scoped_operational_records
        scope = IbOperationalRecord.where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school
        scope
      end

      def scoped_comments
        scope = IbDocumentComment.joins(:curriculum_document).where(curriculum_documents: { tenant_id: tenant.id })
        scope = scope.where(curriculum_documents: { school_id: school.id }) if school
        scope
      end

      def approvals_queue
        scoped_approvals
          .first(25)
          .map do |approval|
            approvable = approval.approvable
            queue_row(
              key: "approval-#{approval.id}",
              title: approvable.respond_to?(:title) ? approvable.title : approval.approvable_type,
              detail: "Awaiting approval.",
              record: approvable,
              updated_at: approval.updated_at
            )
          end
      end

      def moderation_queue
        scoped_operational_records
          .where(risk_level: %w[watch risk])
          .order(updated_at: :desc)
          .limit(25)
          .map do |record|
            queue_row(
              key: "moderation-#{record.id}",
              title: record.title,
              detail: record.next_action.presence || record.summary.to_s.truncate(120),
              record: record,
              updated_at: record.updated_at
            )
          end
      end

      def returned_queue
        scoped_comments
          .where(comment_type: %w[return_note review_note], status: "open")
          .includes(:curriculum_document)
          .order(updated_at: :desc)
          .limit(25)
          .map do |comment|
            queue_row(
              key: "returned-#{comment.id}",
              title: comment.curriculum_document&.title || "Returned document",
              detail: comment.body.to_s.truncate(140),
              record: comment.curriculum_document,
              updated_at: comment.updated_at,
              entity_ref: ::Ib::RouteBuilder.entity_ref_for(comment)
            )
          end
      end

      def orphaned_queue
        scoped_operational_records
          .where(owner_id: nil)
          .or(scoped_operational_records.where(student_id: nil, record_family: %w[myp_project myp_service dp_ia dp_ee dp_tok dp_cas]))
          .order(updated_at: :desc)
          .limit(25)
          .map do |record|
            queue_row(
              key: "orphaned-#{record.id}",
              title: record.title,
              detail: "Missing an owner, student, or advisor assignment.",
              record: record,
              updated_at: record.updated_at
            )
          end
      end

      def sla_breaches
        threshold_days = 5
        stale_documents = scoped_documents.where(status: %w[pending_approval in_review]).where("updated_at < ?", threshold_days.days.ago).limit(25)
        stale_documents.map do |document|
          queue_row(
            key: "sla-#{document.id}",
            title: document.title,
            detail: "No progress for more than #{threshold_days} days.",
            record: document,
            updated_at: document.updated_at
          ).merge(days_in_state: ((Time.current - document.updated_at) / 1.day).floor)
        end
      end

      def summary_metrics
        {
          approvals: approvals_queue.length,
          moderation: moderation_queue.length,
          returned: returned_queue.length,
          orphaned: orphaned_queue.length,
          sla_breaches: sla_breaches.length
        }
      end

      def queue_row(key:, title:, detail:, record:, updated_at:, entity_ref: nil)
        route = ::Ib::RouteBuilder.route_for(record)
        {
          id: key,
          title: title,
          detail: detail,
          route_id: route[:route_id],
          href: route[:href],
          fallback_route_id: route[:fallback_route_id],
          entity_ref: entity_ref || ::Ib::RouteBuilder.entity_ref_for(record),
          changed_since_last_seen: updated_at && updated_at > 3.days.ago,
          updated_at: updated_at&.iso8601
        }
      end
    end
  end
end
