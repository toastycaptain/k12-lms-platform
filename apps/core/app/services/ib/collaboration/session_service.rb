module Ib
  module Collaboration
    class SessionService
      EXPIRY_WINDOW = 2.minutes

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
          active_sessions: sessions.map do |session|
            {
              id: session.id,
              user_id: session.user_id,
              role: session.role,
              scope_type: session.scope_type,
              scope_key: session.scope_key,
              status: session.status,
              device_label: session.device_label,
              last_seen_at: session.last_seen_at.utc.iso8601,
              expires_at: session.expires_at&.utc&.iso8601,
              editing_same_scope: editing_same_scope?(session)
            }
          end,
          conflict_risk: sessions.group_by(&:scope_key).any? { |_scope_key, rows| rows.count { |row| row.role == "editor" } > 1 },
          updated_at: Time.current.utc.iso8601
        }
      end

      def editing_same_scope?(session)
        other_sessions = IbCollaborationSession.active_now.where(curriculum_document: document, scope_key: session.scope_key).where.not(id: session.id)
        other_sessions.exists?
      end

      def expire_stale_sessions!
        IbCollaborationSession.where(curriculum_document: document)
          .where("last_seen_at < ? OR expires_at < ?", EXPIRY_WINDOW.ago, Time.current)
          .update_all(status: "expired") # rubocop:disable Rails/SkipsModelValidations
      end
    end
  end
end
