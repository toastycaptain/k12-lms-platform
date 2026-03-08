module Ib
  module Collaboration
    class WorkbenchService
      TRANSPORT_STRATEGY = {
        strategy: "heartbeat_plus_polling",
        detail: "Phase 10 keeps authenticated polling and durable event storage as the production-safe default while exposing logical channels for later transport swaps.",
        durable_events: %w[suggestion task mention approval_request replay_event],
        ephemeral_events: %w[join leave section_focus lock_acquire lock_release change_patch]
      }.freeze
      CHANNEL_TOPOLOGY = [
        { key: "presence", scope: "document", transport: "polling", auth: "show" },
        { key: "soft_locks", scope: "section", transport: "heartbeat", auth: "update" },
        { key: "suggestions", scope: "document", transport: "durable_events", auth: "show" },
        { key: "review_handoffs", scope: "document", transport: "durable_events", auth: "update" }
      ].freeze
      CONCURRENCY_RULES = {
        optimistic_locking: "Section autosaves require base_version_id.",
        soft_lock_policy: "Editors are warned when more than one active editor claims the same scope_key.",
        merge_strategy: "Section-local changes win locally until autosave detects drift and forces a visible recovery decision.",
        suggestion_mode: "Suggestions are durable comment objects with diff metadata and explicit resolution state."
      }.freeze
      RATE_LIMITS = {
        session_heartbeat_per_minute: 30,
        collaboration_events_per_minute: 60,
        suggestions_per_minute: 20,
        threaded_comments_per_minute: 30
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
          channel_topology: CHANNEL_TOPOLOGY,
          concurrency_rules: CONCURRENCY_RULES,
          rate_limits: RATE_LIMITS,
          route_audit: ROUTE_AUDIT,
          session_summary: session_summary,
          event_summary: event_summary(curriculum_document_id: curriculum_document_id),
          task_summary: task_summary(curriculum_document_id: curriculum_document_id),
          soft_locks: soft_locks(curriculum_document_id: curriculum_document_id),
          suggestions: suggestion_rows(curriculum_document_id: curriculum_document_id),
          comment_threads: comment_threads(curriculum_document_id: curriculum_document_id),
          timeline: timeline_rows(curriculum_document_id: curriculum_document_id),
          permission_audit: permission_audit(curriculum_document_id: curriculum_document_id),
          teacher_success_benchmarks: teacher_success_benchmarks(curriculum_document_id: curriculum_document_id),
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

      def soft_locks(curriculum_document_id: nil)
        scope = IbCollaborationSession.active_now.includes(:user).where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school
        scope = scope.where(curriculum_document_id: curriculum_document_id) if curriculum_document_id.present?

        scope.group_by(&:scope_key).filter_map do |scope_key, rows|
          editors = rows.select { |row| row.role == "editor" }
          next if editors.empty?

          {
            scope_key: scope_key,
            owner_labels: editors.map { |row| row.user&.full_name || row.user&.email || "Unknown" },
            contested: editors.count > 1,
            session_count: editors.count
          }
        end
      end

      def suggestion_rows(curriculum_document_id: nil)
        comment_scope(curriculum_document_id: curriculum_document_id)
          .where(comment_type: "suggestion")
          .order(updated_at: :desc, id: :desc)
          .limit(12)
          .map do |comment|
            {
              id: comment.id,
              body: comment.body,
              status: comment.status,
              anchor_path: comment.anchor_path,
              author_label: comment.author&.full_name || comment.author&.email || "Unknown",
              reply_count: comment.replies.length,
              metadata: comment.metadata,
              updated_at: comment.updated_at.utc.iso8601
            }
          end
      end

      def comment_threads(curriculum_document_id: nil)
        comment_scope(curriculum_document_id: curriculum_document_id)
          .where(parent_comment_id: nil)
          .order(updated_at: :desc, id: :desc)
          .limit(10)
          .map do |comment|
            replies = comment.replies.to_a.sort_by(&:created_at)
            {
              id: comment.id,
              comment_type: comment.comment_type,
              status: comment.status,
              body: comment.body,
              author_label: comment.author&.full_name || comment.author&.email || "Unknown",
              anchor_path: comment.anchor_path,
              resolved_at: comment.resolved_at&.utc&.iso8601,
              reply_count: replies.length,
              replies: replies.map do |reply|
                {
                  id: reply.id,
                  body: reply.body,
                  comment_type: reply.comment_type,
                  status: reply.status,
                  author_label: reply.author&.full_name || reply.author&.email || "Unknown",
                  created_at: reply.created_at.utc.iso8601
                }
              end
            }
          end
      end

      def timeline_rows(curriculum_document_id: nil)
        rows = []
        rows.concat(
          event_scope(curriculum_document_id: curriculum_document_id)
            .order(occurred_at: :desc, id: :desc)
            .limit(8)
            .map do |event|
              {
                id: "event-#{event.id}",
                kind: "event",
                title: event.event_name.humanize,
                detail: event.payload["summary"].presence || event.route_id || event.scope_key,
                occurred_at: event.occurred_at.utc.iso8601
              }
            end
        )
        if curriculum_document_id.present?
          rows.concat(
            CurriculumDocumentVersion.where(curriculum_document_id: curriculum_document_id)
              .includes(:created_by)
              .order(version_number: :desc)
              .limit(6)
              .map do |version|
                {
                  id: "version-#{version.id}",
                  kind: "version",
                  title: "Version #{version.version_number}",
                  detail: version.created_by&.full_name || version.created_by&.email || "Unknown",
                  occurred_at: version.created_at.utc.iso8601
                }
              end
          )
        end
        rows.sort_by { |row| row[:occurred_at] }.reverse.first(12)
      end

      def permission_audit(curriculum_document_id: nil)
        collaborator_roles =
          if curriculum_document_id.present?
            IbDocumentCollaborator.where(
              tenant_id: tenant.id,
              curriculum_document_id: curriculum_document_id
            )
          else
            IbDocumentCollaborator.none
          end

        {
          can_edit: privileged_actor?,
          can_comment: actor.present?,
          can_suggest: actor.present?,
          can_assign_tasks: privileged_actor?,
          collaborator_roles: collaborator_roles.group(:role).count
        }
      end

      def teacher_success_benchmarks(curriculum_document_id: nil)
        suggestion_count = comment_scope(curriculum_document_id: curriculum_document_id).where(comment_type: "suggestion").count
        {
          active_editors: IbCollaborationSession.active_now.where(tenant_id: tenant.id).yield_self { |scope| school ? scope.where(school_id: school.id) : scope }.count,
          open_tasks: task_scope(curriculum_document_id: curriculum_document_id).where(status: %w[open in_progress blocked]).count,
          suggestions_pending: suggestion_count,
          replay_window_events: event_scope(curriculum_document_id: curriculum_document_id).where("occurred_at >= ?", 24.hours.ago).count
        }
      end

      def comment_scope(curriculum_document_id: nil)
        scope = IbDocumentComment.includes(:author, replies: :author).where(tenant_id: tenant.id)
        if school
          scope = scope.joins(:curriculum_document).where(curriculum_documents: { school_id: school.id })
        end
        scope = scope.where(curriculum_document_id: curriculum_document_id) if curriculum_document_id.present?
        scope
      end

      def privileged_actor?
        actor&.has_role?(:teacher) || actor&.has_role?(:admin) || actor&.has_role?(:curriculum_lead) || actor&.has_role?(:district_admin)
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
