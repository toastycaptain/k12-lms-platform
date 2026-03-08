module Ib
  module Collaboration
    class SessionService
      EXPIRY_WINDOW = 2.minutes
      CHANNEL_TOPOLOGY = [
        {
          key: "document_presence",
          scope: "curriculum_document",
          transport: "authenticated_polling",
          auth: "CurriculumDocumentPolicy#show?"
        },
        {
          key: "section_presence",
          scope: "section_key",
          transport: "session_heartbeat",
          auth: "CurriculumDocumentPolicy#update?"
        },
        {
          key: "durable_change_feed",
          scope: "collaboration_events",
          transport: "event_log",
          auth: "IbCollaborationEventPolicy#index?"
        }
      ].freeze
      CONCURRENCY_POLICY = {
        optimistic_lock: "base_version_id on section autosave",
        soft_locks: "active editor heartbeats grouped by scope_key",
        merge_strategy: "keep section-local patch, surface conflict explicitly, then replay against the latest version",
        replay_source: "collaboration events + curriculum document versions"
      }.freeze

      def initialize(document:, user:, school: nil)
        @document = document
        @user = user
        @school = school
      end

      def sync!(session_key:, scope_type: "document", scope_key: "root", role: "editor", device_label: nil, status: "active", metadata: {})
        expire_stale_sessions!

        session = IbCollaborationSession.find_or_initialize_by(
          tenant: user.tenant,
          curriculum_document: document,
          user: user,
          session_key: session_key
        )
        session.assign_attributes(
          school: school,
          scope_type: scope_type,
          scope_key: scope_key,
          role: role,
          device_label: device_label,
          status: status,
          last_seen_at: Time.current,
          expires_at: EXPIRY_WINDOW.from_now,
          metadata: session.metadata.merge(metadata.to_h.deep_stringify_keys)
        )
        session.save!

        Ib::Support::ActivityEventService.record!(
          tenant: user.tenant,
          user: user,
          school: school,
          event_name: "ib.collaboration.heartbeat",
          event_family: "collaboration",
          surface: "document_studio",
          entity_ref: "CurriculumDocument:#{document.id}",
          session_key: session_key,
          metadata: {
            document_id: document.id,
            scope_key: scope_key,
            role: role
          },
          dedupe_key: "collaboration:#{session_key}:#{Time.current.to_i / 10}"
        )

        payload_for(session)
      end

      def list
        expire_stale_sessions!
        payload_for(nil)
      end

      private

      attr_reader :document, :user, :school

      def payload_for(current_session)
        sessions = IbCollaborationSession.active_now.where(curriculum_document: document).includes(:user)
        {
          document_id: document.id,
          current_session_id: current_session&.id,
          channel_topology: CHANNEL_TOPOLOGY,
          concurrency_policy: CONCURRENCY_POLICY,
          active_sessions: sessions.map do |session|
            {
              id: session.id,
              user_id: session.user_id,
              user_label: session.user&.full_name || session.user&.email || "Unknown",
              role: session.role,
              scope_type: session.scope_type,
              scope_key: session.scope_key,
              status: session.status,
              device_label: session.device_label,
              last_seen_at: session.last_seen_at.utc.iso8601,
              expires_at: session.expires_at&.utc&.iso8601,
              editing_same_scope: editing_same_scope?(session),
              heartbeat_age_seconds: (Time.current - session.last_seen_at).round,
              metadata: session.metadata
            }
          end,
          soft_locks: soft_locks_for(sessions),
          conflict_risk: sessions.group_by(&:scope_key).any? { |_scope_key, rows| rows.count { |row| row.role == "editor" } > 1 },
          updated_at: Time.current.utc.iso8601
        }
      end

      def editing_same_scope?(session)
        other_sessions = IbCollaborationSession.active_now.where(curriculum_document: document, scope_key: session.scope_key).where.not(id: session.id)
        other_sessions.exists?
      end

      def soft_locks_for(sessions)
        sessions.group_by(&:scope_key).filter_map do |scope_key, rows|
          editors = rows.select { |row| row.role == "editor" }
          next if editors.empty?

          {
            scope_key: scope_key,
            owner_user_ids: editors.map(&:user_id),
            owner_labels: editors.map { |row| row.user&.full_name || row.user&.email || "Unknown" },
            contested: editors.size > 1,
            session_ids: editors.map(&:id)
          }
        end
      end

      def expire_stale_sessions!
        IbCollaborationSession.where(curriculum_document: document)
          .where("last_seen_at < ? OR expires_at < ?", EXPIRY_WINDOW.ago, Time.current)
          .update_all(status: "expired") # rubocop:disable Rails/SkipsModelValidations
      end
    end
  end
end
