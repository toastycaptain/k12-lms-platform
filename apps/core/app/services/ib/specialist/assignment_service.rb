module Ib
  module Specialist
    class AssignmentService
      def initialize(user:, school: nil)
        @user = user
        @school = school
      end

      def build
        {
          owned_work: collaborator_rows(user_id: user.id),
          requested_contributions: collaborator_rows(role: "specialist_contributor", excluding_user_id: user.id),
          pending_responses: operational_rows.where(record_family: "specialist", status: %w[requested awaiting_response]).limit(6).map { |record| operational_payload(record) },
          evidence_to_sort: evidence_scope.where(status: %w[needs_validation reflection_requested]).limit(6).map { |item| evidence_payload(item) },
          overload_signals: overload_signals,
          assignment_gaps: assignment_gaps
        }
      end

      def upsert_assignment!(document:, assigned_user:, role:, contribution_mode:, detail: nil)
        collaborator = IbDocumentCollaborator.find_or_initialize_by(
          tenant: user.tenant,
          curriculum_document: document,
          user: assigned_user,
          role: role
        )
        collaborator.assigned_by = user
        collaborator.status = "active"
        collaborator.contribution_mode = contribution_mode
        collaborator.metadata = collaborator.metadata.merge("detail" => detail).compact
        collaborator.save!
        collaborator
      end

      private

      attr_reader :user, :school

      def collaborator_scope
        scope = IbDocumentCollaborator.active.includes(:curriculum_document).where(tenant_id: user.tenant_id)
        if school
          scope = scope.joins(:curriculum_document).where(curriculum_documents: { school_id: school.id })
        end
        scope
      end

      def collaborator_rows(user_id: nil, role: nil, excluding_user_id: nil)
        scope = collaborator_scope
        scope = scope.where(user_id: user_id) if user_id
        scope = scope.where(role: role) if role
        scope = scope.where.not(user_id: excluding_user_id) if excluding_user_id
        scope.order(updated_at: :desc).limit(8).map do |item|
          {
            id: item.id,
            title: item.curriculum_document&.title || "Document",
            detail: item.metadata["detail"].presence || "#{item.role.humanize} • #{item.contribution_mode}",
            href: Ib::RouteBuilder.href_for(item.curriculum_document),
            contribution_mode: item.contribution_mode,
            role: item.role,
            status: item.status,
            handoff_state: item.metadata["handoff_state"].presence || "active"
          }
        end
      end

      def operational_rows
        scope = IbOperationalRecord.where(tenant_id: user.tenant_id)
        scope = scope.where(school_id: school.id) if school
        scope.order(due_on: :asc, updated_at: :desc)
      end

      def evidence_scope
        scope = IbEvidenceItem.where(tenant_id: user.tenant_id, contributor_type: %w[specialist teacher])
        scope = scope.where(school_id: school.id) if school
        scope.order(updated_at: :desc)
      end

      def overload_signals
        collaborator_scope.group(:user_id).count.filter_map do |user_id, count|
          next if count < 4

          {
            user_id: user_id,
            assigned_count: count,
            severity: count >= 7 ? "risk" : "watch"
          }
        end
      end

      def assignment_gaps
        documents = if school
          CurriculumDocument.where(tenant_id: user.tenant_id, school_id: school.id)
        else
          CurriculumDocument.where(tenant_id: user.tenant_id)
        end
        documents.where(document_type: [ "ib_pyp_unit", "ib_myp_unit", "ib_dp_course_map" ]).limit(12).filter_map do |document|
          next if collaborator_scope.where(curriculum_document_id: document.id, role: "specialist_contributor").exists?

          {
            document_id: document.id,
            title: document.title,
            href: Ib::RouteBuilder.href_for(document)
          }
        end.first(5)
      end

      def operational_payload(record)
        {
          id: record.id,
          title: record.title,
          detail: record.next_action.presence || record.summary.to_s.truncate(100),
          due_on: record.due_on,
          href: Ib::RouteBuilder.href_for(record),
          handoff_state: record.metadata["handoff_state"].presence || record.status
        }
      end

      def evidence_payload(item)
        {
          id: item.id,
          title: item.title,
          detail: item.next_action.presence || item.summary.to_s.truncate(100),
          href: Ib::RouteBuilder.href_for(item),
          status: item.status
        }
      end
    end
  end
end
