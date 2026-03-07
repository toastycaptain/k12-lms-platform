module Ib
  module Collaboration
    class WorkbenchService
      TRANSPORT_STRATEGY = {
        strategy: "heartbeat_plus_polling",
        detail: "Phase 9 keeps session heartbeat + durable event storage while reserving websocket transport for a later rollout flag.",
        durable_events: %w[suggestion task mention approval_request replay_event],
        ephemeral_events: %w[join leave section_focus lock_acquire lock_release change_patch]
      }.freeze

      ROUTE_AUDIT = [
        "/ib/planning/collaboration",
        "/ib/pyp/units/:unitId",
        "/ib/myp/units/:unitId",
        "/ib/dp/course-maps/:courseId",
        "/ib/review",
        "/ib/specialist"
      ].freeze

      def initialize(tenant:, school: nil, actor: nil)
        @tenant = tenant
        @school = school
        @actor = actor
      end

      def build(curriculum_document_id: nil)
        {
          generated_at: Time.current.utc.iso8601,
          transport_strategy: TRANSPORT_STRATEGY,
          route_audit: ROUTE_AUDIT,
          session_summary: session_summary,
          event_summary: event_summary(curriculum_document_id: curriculum_document_id),
          task_summary: task_summary(curriculum_document_id: curriculum_document_id),
          recent_events: event_scope(curriculum_document_id: curriculum_document_id).order(occurred_at: :desc, id: :desc).limit(12).map { |event| serialize_event(event) },
          tasks: task_scope(curriculum_document_id: curriculum_document_id).order(updated_at: :desc, id: :desc).limit(12).map { |task| serialize_task(task) }
        }
      end

      def record_event!(attrs)
        event = base_event_scope.new(
          school: school,
          curriculum_document_id: attrs[:curriculum_document_id],
          ib_collaboration_session_id: attrs[:ib_collaboration_session_id],
          user: actor,
          event_name: attrs[:event_name].presence || "replay_event",
          route_id: attrs[:route_id],
          scope_key: attrs[:scope_key].presence || attrs[:curriculum_document_id].to_s,
          section_key: attrs[:section_key],
          durable: ActiveModel::Type::Boolean.new.cast(attrs[:durable]),
          payload: normalize_hash(attrs[:payload]),
          occurred_at: Time.current
        )
        event.save!
        serialize_event(event)
      end

      def upsert_task!(attrs)
        task = attrs[:id].present? ? base_task_scope.find(attrs[:id]) : base_task_scope.new
        task.assign_attributes(
          school: school,
          curriculum_document_id: attrs[:curriculum_document_id],
          created_by: task.created_by || actor,
          assigned_to_id: attrs[:assigned_to_id],
          status: attrs[:status].presence || task.status || "open",
          priority: attrs[:priority].presence || task.priority || "medium",
          title: attrs[:title].presence || task.title || "Follow-up",
          detail: attrs[:detail].presence || task.detail,
          due_on: attrs[:due_on],
          section_key: attrs[:section_key],
          mention_payload: task.mention_payload.merge(normalize_hash(attrs[:mention_payload])),
          metadata: task.metadata.merge(normalize_hash(attrs[:metadata]))
        )
        task.save!
        serialize_task(task)
      end

      private

      attr_reader :tenant, :school, :actor

      def base_event_scope
        scope = IbCollaborationEvent.where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school
        scope
      end

      def base_task_scope
        scope = IbCollaborationTask.where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school
        scope
      end

      def event_scope(curriculum_document_id: nil)
        scope = base_event_scope
        scope = scope.where(curriculum_document_id: curriculum_document_id) if curriculum_document_id.present?
        scope
      end

      def task_scope(curriculum_document_id: nil)
        scope = base_task_scope
        scope = scope.where(curriculum_document_id: curriculum_document_id) if curriculum_document_id.present?
        scope
      end

      def session_summary
        sessions = IbCollaborationSession.where(tenant_id: tenant.id)
        sessions = sessions.where(school_id: school.id) if school
        {
          active_now: sessions.active_now.count,
          reconnecting: sessions.where(status: "reconnecting").count,
          paused: sessions.where(status: "paused").count
        }
      end

      def event_summary(curriculum_document_id: nil)
        scope = event_scope(curriculum_document_id: curriculum_document_id)
        {
          durable_count: scope.where(durable: true).count,
          ephemeral_count: scope.where(durable: false).count,
          mention_events: scope.where(event_name: "mention").count,
          suggestion_events: scope.where(event_name: "suggestion").count
        }
      end

      def task_summary(curriculum_document_id: nil)
        scope = task_scope(curriculum_document_id: curriculum_document_id)
        {
          open_count: scope.where(status: %w[open in_progress blocked]).count,
          overdue_count: scope.where(status: %w[open in_progress blocked]).where("due_on < ?", Date.current).count,
          assigned_to_me: actor ? scope.where(assigned_to_id: actor.id).count : 0
        }
      end

      def serialize_event(event)
        {
          id: event.id,
          event_name: event.event_name,
          route_id: event.route_id,
          scope_key: event.scope_key,
          section_key: event.section_key,
          durable: event.durable,
          payload: event.payload,
          occurred_at: event.occurred_at.utc.iso8601,
          user_label: event.user&.full_name || event.user&.email || "Unknown"
        }
      end

      def serialize_task(task)
        {
          id: task.id,
          curriculum_document_id: task.curriculum_document_id,
          status: task.status,
          priority: task.priority,
          title: task.title,
          detail: task.detail,
          due_on: task.due_on&.iso8601,
          section_key: task.section_key,
          mention_payload: task.mention_payload,
          assigned_to_label: task.assigned_to&.full_name || task.assigned_to&.email,
          updated_at: task.updated_at.utc.iso8601
        }
      end

      def normalize_hash(value)
        value.is_a?(Hash) ? value.deep_stringify_keys : {}
      end
    end
  end
end
