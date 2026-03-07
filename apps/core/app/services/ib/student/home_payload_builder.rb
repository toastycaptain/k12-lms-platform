module Ib
  module Student
    class HomePayloadBuilder
      def initialize(user:, school: nil)
        @user = user
        @school = school
      end

      def build
        evidence = scoped_evidence
        records = scoped_records
        {
          next_checkpoints: records.first(5).map { |record| serialize_record(record) },
          reflections_due: evidence.joins(:reflection_requests).merge(IbReflectionRequest.where(status: "requested")).limit(5).map { |item| serialize_evidence(item) },
          validated_evidence: evidence.where(status: "validated").limit(5).map { |item| serialize_evidence(item) },
          project_milestones: records.where(record_family: %w[myp_project myp_service dp_core dp_ia dp_ee dp_tok dp_cas]).limit(5).map { |record| serialize_record(record) },
          released_reports: released_reports,
          learning_timeline: Ib::Student::TimelineService.new(user: user, school: school).build,
          goals: goal_rows,
          next_actions: next_action_rows(records, evidence),
          reflection_system: Ib::Student::ReflectionService.new(user: user, school: school).build,
          growth_visualization: growth_visualization(records, evidence),
          milestone_journey: Ib::Student::MilestoneSummaryService.new(user: user, school: school).build,
          peer_feedback: Ib::Student::PeerFeedbackService.new(user: user, school: school).build,
          portfolio: Ib::Student::PortfolioSearchService.new(user: user, school: school).build,
          quick_actions: quick_actions(records, evidence),
          notification_preferences: student_notification_preferences,
          communication_preferences: communication_preferences,
          delivery_receipts: delivery_receipts,
          release_gates: {
            accessible_mobile_actions: true,
            calm_notifications: student_notification_preferences.values.count { |value| value["email_frequency"] == "immediate" } <= 2,
            timeline_ready: true
          }
        }
      end

      private

      attr_reader :user, :school

      def scoped_evidence
        scope = IbEvidenceItem.where(tenant_id: user.tenant_id)
        scope = scope.where(school_id: school.id) if school
        scope = scope.where(student_id: user.id) if user.has_role?(:student)
        scope.order(updated_at: :desc)
      end

      def scoped_records
        scope = IbOperationalRecord.where(tenant_id: user.tenant_id)
        scope = scope.where(school_id: school.id) if school
        scope = scope.where(student_id: user.id) if user.has_role?(:student)
        scope.order(due_on: :asc, updated_at: :desc)
      end

      def serialize_record(record)
        {
          id: record.id,
          programme: record.programme,
          record_family: record.record_family,
          title: record.title,
          summary: record.summary,
          next_action: record.next_action,
          due_on: record.due_on,
          risk_level: record.risk_level,
          href: Ib::RouteBuilder.href_for(record)
        }
      end

      def serialize_evidence(item)
        {
          id: item.id,
          title: item.title,
          summary: item.summary,
          status: item.status,
          visibility: item.visibility
        }
      end

      def goal_rows
        Goal.where(tenant_id: user.tenant_id, student_id: user.id).order(target_date: :asc, updated_at: :desc).limit(6).map do |goal|
          {
            id: goal.id,
            title: goal.title,
            description: goal.description,
            status: goal.status,
            progress_percent: goal.progress_percent,
            target_date: goal.target_date
          }
        end
      end

      def next_action_rows(records, evidence)
        [
          records.first,
          evidence.find_by(status: "reflection_requested"),
          Goal.where(tenant_id: user.tenant_id, student_id: user.id, status: "active").order(target_date: :asc).first
        ].compact.map do |item|
          if item.is_a?(Goal)
            {
              id: "goal-#{item.id}",
              title: item.title,
              detail: item.description.presence || "Advance this goal next.",
              href: "/learn/goals",
              tone: item.progress_percent.to_i >= 70 ? "success" : "accent"
            }
          else
            {
              id: "#{item.class.name.demodulize.underscore}-#{item.id}",
              title: item.title,
              detail: item.try(:next_action).presence || item.try(:summary).to_s,
              href: item.is_a?(IbEvidenceItem) ? Ib::RouteBuilder.href_for(item) : Ib::RouteBuilder.href_for(item),
              tone: item.try(:risk_level) == "risk" ? "risk" : "accent"
            }
          end
        end
      end

      def growth_visualization(records, evidence)
        {
          criteria: growth_series(records, key: "criteria"),
          atl: growth_series(evidence, key: "atl_tags"),
          learner_profile: growth_series(evidence, key: "learner_profile")
        }
      end

      def growth_series(scope, key:)
        scope.first(6).map.with_index do |record, index|
          {
            label: record.respond_to?(:title) ? record.title.truncate(24) : "Point #{index + 1}",
            value: Array(record.metadata[key]).presence&.length || (index + 1)
          }
        end
      end

      def quick_actions(records, evidence)
        [
          {
            id: "quick-reflection",
            label: "Answer next reflection",
            detail: evidence.find_by(status: "reflection_requested")&.title || "Open the next reflection request.",
            href: "/learn/goals"
          },
          {
            id: "quick-portfolio",
            label: "Open portfolio",
            detail: "Collect evidence for a narrative progression view.",
            href: "/learn/portfolio"
          },
          {
            id: "quick-milestone",
            label: "Check next milestone",
            detail: records.first&.title || "Review the next milestone.",
            href: records.first ? Ib::RouteBuilder.href_for(records.first) : "/ib/student/home"
          }
        ]
      end

      def student_notification_preferences
        NotificationPreference.for_user(user).slice("assignment_due_soon", "ib_story_published", "message_received")
      end

      def communication_preferences
        record = IbCommunicationPreference.find_or_create_by!(
          tenant: user.tenant,
          school: school,
          user: user,
          audience: "student"
        )
        {
          locale: record.locale,
          digest_cadence: record.digest_cadence,
          quiet_hours_start: record.quiet_hours_start,
          quiet_hours_end: record.quiet_hours_end,
          quiet_hours_timezone: record.quiet_hours_timezone,
          delivery_rules: record.delivery_rules
        }
      end

      def released_reports
        scope = IbReport.where(tenant_id: user.tenant_id, audience: %w[student conference], status: "released")
        scope = scope.where(school_id: school.id) if school
        scope = scope.where(student_id: user.id) if user.has_role?(:student)
        scope.order(released_at: :desc, updated_at: :desc).limit(6).map do |report|
          {
            id: report.id,
            title: report.title,
            summary: report.summary,
            report_family: report.report_family,
            programme: report.programme,
            href: "/ib/reports#report-#{report.id}",
            released_at: report.released_at&.utc&.iso8601
          }
        end
      end

      def delivery_receipts
        scope = IbDeliveryReceipt.where(tenant_id: user.tenant_id, user_id: user.id, audience_role: "student")
        scope = scope.where(school_id: school.id) if school
        scope.order(updated_at: :desc).limit(8).map do |receipt|
          {
            id: "#{receipt.deliverable_type}:#{receipt.deliverable_id}",
            state: receipt.state,
            deliverable_type: receipt.deliverable_type,
            deliverable_id: receipt.deliverable_id,
            read_at: receipt.read_at&.utc&.iso8601,
            acknowledged_at: receipt.acknowledged_at&.utc&.iso8601
          }
        end
      end
    end
  end
end
