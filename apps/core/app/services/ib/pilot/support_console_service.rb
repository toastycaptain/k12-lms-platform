module Ib
  module Pilot
    class SupportConsoleService
      def initialize(tenant:, school: nil, actor: nil)
        @tenant = tenant
        @school = school
        @actor = actor
      end

      def build
        {
          generated_at: Time.current.utc.iso8601,
          launch_day: launch_day_items,
          reporting_week: reporting_week_items,
          moderation_week: moderation_items,
          feedback_queue: feedback_scope.order(updated_at: :desc, id: :desc).limit(12).map { |item| serialize_feedback(item) }
        }
      end

      def create_feedback!(attrs)
        item = feedback_scope.new(
          school: school,
          ib_pilot_profile_id: attrs[:ib_pilot_profile_id],
          user: actor,
          title: attrs[:title].presence || "Feedback",
          detail: attrs[:detail],
          surface: attrs[:surface].presence || "unknown",
          category: attrs[:category].presence || infer_category(attrs[:surface]),
          role_scope: attrs[:role_scope].presence || inferred_role_scope,
          sentiment: attrs[:sentiment].presence || infer_sentiment(attrs[:detail]),
          tags: Array(attrs[:tags]),
          routing_payload: normalize_hash(attrs[:routing_payload]),
          metadata: normalize_hash(attrs[:metadata])
        )
        item.save!
        serialize_feedback(item)
      end

      def update_feedback!(item, attrs)
        item.update!(
          status: attrs[:status].presence || item.status,
          sentiment: attrs[:sentiment].presence || item.sentiment,
          category: attrs[:category].presence || item.category,
          tags: Array(attrs[:tags]).presence || item.tags,
          routing_payload: item.routing_payload.merge(normalize_hash(attrs[:routing_payload])),
          metadata: item.metadata.merge(normalize_hash(attrs[:metadata]))
        )
        serialize_feedback(item)
      end

      private

      attr_reader :tenant, :school, :actor

      def feedback_scope
        scope = IbPilotFeedbackItem.where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school
        scope
      end

      def launch_day_items
        [
          health_row("pilot_setup", "Pilot setup", count_for("IbPilotProfile"), "/ib/rollout"),
          health_row("migration", "Migration sessions", count_for("IbMigrationSession"), "/ib/rollout"),
          health_row("reports", "Reports pending release", count_for("IbReport", status: [ "in_review", "signed_off" ]), "/ib/reports")
        ]
      end

      def reporting_week_items
        [
          health_row("cycles", "Active reporting cycles", count_for("IbReportCycle", status: [ "open", "proofing", "approved" ]), "/ib/reports"),
          health_row("deliveries", "Recent deliveries", count_for("IbReportDelivery", status: [ "queued", "delivered" ]), "/ib/reports"),
          health_row("read_receipts", "Read or acknowledged", count_for("IbDeliveryReceipt", state: [ "read", "acknowledged" ]), "/ib/reports")
        ]
      end

      def moderation_items
        [
          health_row("comments", "Open collaboration tasks", count_for("IbCollaborationTask", status: [ "open", "in_progress", "blocked" ]), "/ib/planning/collaboration"),
          health_row("family", "Guardian responses", count_for("IbPilotFeedbackItem", role_scope: "guardian"), "/ib/guardian/home"),
          health_row("student", "Student trust signals", count_for("IbPilotFeedbackItem", role_scope: "student"), "/ib/student/home")
        ]
      end

      def health_row(key, label, count, href)
        {
          key: key,
          label: label,
          count: count,
          status: count.positive? ? "active" : "watch",
          href: href
        }
      end

      def count_for(model_name, conditions = {})
        model = model_name.safe_constantize
        return 0 unless model

        scope = model.where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school && model.column_names.include?("school_id")
        conditions.each do |key, value|
          scope = scope.where(key => value)
        end
        scope.count
      rescue StandardError
        0
      end

      def serialize_feedback(item)
        {
          id: item.id,
          title: item.title,
          detail: item.detail,
          status: item.status,
          sentiment: item.sentiment,
          category: item.category,
          role_scope: item.role_scope,
          surface: item.surface,
          tags: item.tags,
          routing_payload: item.routing_payload,
          created_at: item.created_at.utc.iso8601,
          updated_at: item.updated_at.utc.iso8601
        }
      end

      def infer_category(surface)
        case surface.to_s
        when /report/
          "reporting"
        when /search/
          "search"
        when /mobile/
          "mobile"
        else
          "general"
        end
      end

      def infer_sentiment(detail)
        text = detail.to_s.downcase
        return "urgent" if text.include?("blocked") || text.include?("urgent")
        return "negative" if text.include?("slow") || text.include?("broken")
        return "positive" if text.include?("helpful") || text.include?("fast")

        "neutral"
      end

      def inferred_role_scope
        return "admin" if actor&.has_role?(:admin)
        return "specialist" if actor&.has_role?(:specialist)
        return "guardian" if actor&.has_role?(:guardian)
        return "student" if actor&.has_role?(:student)
        return "coordinator" if actor&.has_role?(:curriculum_lead)

        "teacher"
      end

      def normalize_hash(value)
        value.is_a?(Hash) ? value.deep_stringify_keys : {}
      end
    end
  end
end
