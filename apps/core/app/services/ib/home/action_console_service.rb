module Ib
  module Home
    class ActionConsoleService
      def initialize(user:, school: nil, programme: nil)
        @user = user
        @school = school
        @programme = programme || "Mixed"
      end

      def build
        {
          pinned_items: pinned_items,
          due_today: due_today,
          recent_history: recent_history,
          quick_mutations: quick_mutations,
          benchmark_snapshot: benchmark_snapshot,
          last_seen_at: last_seen_at&.iso8601
        }
      end

      def mark_seen!
        IbUserWorkspacePreference.write_value!(
          user: user,
          school: school,
          surface: "teacher_home",
          context_key: "visits",
          preference_key: "last_seen",
          programme: programme,
          value: { "last_seen_at" => Time.current.utc.iso8601 }
        )
      end

      private

      attr_reader :user, :school, :programme

      def pinned_items
        refs = Array(preference_value("pins", "teacher_home")["entity_refs"]).first(6)
        refs.filter_map { |ref| resolve_entity_ref(ref) }
      end

      def due_today
        scope = IbOperationalRecord.where(tenant_id: user.tenant_id)
        scope = scope.where(school_id: school.id) if school
        scope.where(due_on: Date.current).order(priority: :desc, updated_at: :desc).limit(5).map do |record|
          action_item_for(
            title: record.title,
            detail: record.next_action.presence || "Due today",
            href: Ib::RouteBuilder.href_for(record),
            entity_ref: Ib::RouteBuilder.entity_ref_for(record),
            programme: record.programme,
            action_type: "due_today",
            priority_score: 96,
            status_tone: record.risk_level == "risk" ? "risk" : "warm"
          )
        end
      end

      def recent_history
        scope = IbActivityEvent.where(tenant_id: user.tenant_id, user_id: user.id)
        scope = scope.where(school_id: school.id) if school
        events = scope.where(event_name: [ "ib.route.view", "ib.search.open_result", "ib.command.execute" ]).recent.limit(6)
        events.map do |event|
          action_item_for(
            title: event.metadata["label"].presence || event.route_id.to_s.humanize,
            detail: event.metadata["detail"].presence || "Recent work",
            href: event.metadata["href"].presence || "/ib/home",
            entity_ref: event.entity_ref.presence || "route:#{event.route_id}",
            programme: event.programme,
            action_type: "recent_history",
            priority_score: 58,
            status_tone: "default"
          )
        end
      end

      def quick_mutations
        [
          {
            id: "pin-last",
            label: "Pin current work",
            detail: "Save the last active route to the teacher home rail.",
            mutation_type: "pin_recent_work"
          },
          {
            id: "review-evidence",
            label: "Request reflection",
            detail: "Start a reflection request without opening the full evidence queue.",
            mutation_type: "request_reflection"
          },
          {
            id: "publish-hold",
            label: "Hold family story",
            detail: "Pause a story until the narrative is clearer.",
            mutation_type: "hold_story"
          },
          {
            id: "review-return",
            label: "Return for edits",
            detail: "Send a fast coordinator return note from home.",
            mutation_type: "return_for_edit"
          },
          {
            id: "duplicate-unit",
            label: "Duplicate current unit",
            detail: "Start a copy or carry-forward flow in two steps.",
            mutation_type: "duplicate_document"
          }
        ]
      end

      def benchmark_snapshot
        workflow = Ib::Support::WorkflowBenchmarkService.new(tenant: user.tenant, school: school).build[:workflows]
        workflow.first(3)
      end

      def last_seen_at
        raw = preference_value("visits", "last_seen")["last_seen_at"]
        return if raw.blank?

        Time.zone.parse(raw)
      rescue ArgumentError
        nil
      end

      def preference_value(context_key, preference_key)
        IbUserWorkspacePreference.read_value(
          user: user,
          school: school,
          surface: "teacher_home",
          context_key: context_key,
          preference_key: preference_key,
          programme: programme
        )
      end

      def resolve_entity_ref(entity_ref)
        type, id = entity_ref.to_s.split(":", 2)
        record = case type
        when "curriculum_document", "CurriculumDocument" then CurriculumDocument.find_by(id: id, tenant_id: user.tenant_id)
        when "ib_operational_record", "IbOperationalRecord" then IbOperationalRecord.find_by(id: id, tenant_id: user.tenant_id)
        when "ib_evidence_item", "IbEvidenceItem" then IbEvidenceItem.find_by(id: id, tenant_id: user.tenant_id)
        when "ib_learning_story", "IbLearningStory" then IbLearningStory.find_by(id: id, tenant_id: user.tenant_id)
        end
        return unless record

        action_item_for(
          title: record.title,
          detail: "Pinned work",
          href: Ib::RouteBuilder.href_for(record),
          entity_ref: entity_ref,
          programme: record.try(:programme).presence || programme,
          action_type: "pinned_work",
          priority_score: 92,
          status_tone: "accent"
        )
      end

      def action_item_for(title:, detail:, href:, entity_ref:, programme:, action_type:, priority_score:, status_tone:)
        {
          id: Digest::SHA256.hexdigest("#{action_type}:#{entity_ref}")[0, 12],
          label: title,
          detail: detail,
          href: href,
          entity_ref: entity_ref,
          action_type: action_type,
          programme: programme,
          priority_score: priority_score,
          tone: status_tone,
          status: status_tone == "risk" ? "risk" : status_tone == "warm" ? "watch" : "healthy"
        }
      end
    end
  end
end
