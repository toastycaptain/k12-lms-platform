module Ib
  module Home
    class PayloadBuilder
      PROGRAMMES = %w[PYP MYP DP Mixed].freeze

      def initialize(user:, school: nil)
        @user = user
        @school = school
      end

      def build
        Rails.cache.fetch(cache_key, expires_in: 2.minutes) do
          {
          programme: inferred_programme,
          school_label: school&.name || "All schools",
          coordinator_mode: coordinator_mode?,
          resume_items: resume_items,
          change_feed: change_feed,
          evidence_actions: evidence_actions,
          publishing_actions: publishing_actions,
          coordinator_comments: coordinator_comments,
          projects_core_follow_up: projects_core_follow_up,
          quick_actions: quick_actions,
          coordinator_cards: coordinator_cards
          }.merge(console_extras)
        end
      end

      private

      attr_reader :user, :school

      def cache_key
        [ "ib-home", user.tenant_id, user.id, school&.id, inferred_programme, current_documents.maximum(:updated_at)&.to_i ]
      end

      def current_documents
        scope = CurriculumDocument.includes(:current_version, :tenant).where(tenant_id: user.tenant_id)
        scope = scope.where(school_id: school.id) if school
        scope.order(updated_at: :desc).limit(12)
      end

      def current_evidence
        scope = IbEvidenceItem.where(tenant_id: user.tenant_id)
        scope = scope.where(school_id: school.id) if school
        scope.order(updated_at: :desc).limit(8)
      end

      def current_stories
        scope = IbLearningStory.where(tenant_id: user.tenant_id)
        scope = scope.where(school_id: school.id) if school
        scope.order(updated_at: :desc).limit(8)
      end

      def current_comments
        scope = IbDocumentComment.includes(:curriculum_document).where(tenant_id: user.tenant_id)
        scope = scope.joins(curriculum_document: :school).where(curriculum_documents: { school_id: school.id }) if school
        scope.open_status.order(updated_at: :desc).limit(6)
      end

      def current_records
        scope = IbOperationalRecord.where(tenant_id: user.tenant_id)
        scope = scope.where(school_id: school.id) if school
        scope.order(priority: :desc, updated_at: :desc).limit(8)
      end

      def inferred_programme
        programmes = current_documents.limit(20).map { |document| programme_for(document) }.uniq
        return programmes.first if programmes.one?

        "Mixed"
      end

      def coordinator_mode?
        user.has_role?(:admin) || user.has_role?(:curriculum_lead) || user.has_role?(:district_admin)
      end

      def resume_items
        current_documents.first(4).map do |document|
          readiness = Ib::ReadinessService.document_summary(document)
          item(
            title: document.title,
            detail: readiness[:ready] ? "Resume where you left off." : "#{readiness[:blocker_count]} readiness blocker(s) still need attention.",
            href: Ib::RouteBuilder.href_for(document),
            entity_ref: Ib::RouteBuilder.entity_ref_for(document),
            action_type: "resume_work",
            programme: programme_for(document),
            priority_score: priority_for_document(document, readiness),
            status_tone: readiness[:ready] ? "accent" : "warm",
            changed_since_last_seen: true
          )
        end
      end

      def change_feed
        current_comments.first(4).map do |comment|
          item(
            title: comment.curriculum_document&.title || "Commented document",
            detail: comment.body.truncate(120),
            href: Ib::RouteBuilder.href_for(comment.curriculum_document),
            entity_ref: Ib::RouteBuilder.entity_ref_for(comment),
            action_type: "needs_review",
            programme: programme_for(comment.curriculum_document),
            priority_score: 75,
            status_tone: "warm",
            changed_since_last_seen: true
          )
        end
      end

      def evidence_actions
        current_evidence.first(4).map do |evidence|
          item(
            title: evidence.title,
            detail: evidence.next_action.presence || evidence.summary.to_s.truncate(120),
            href: Ib::RouteBuilder.href_for(evidence),
            entity_ref: Ib::RouteBuilder.entity_ref_for(evidence),
            action_type: evidence.status == "reflection_requested" ? "awaiting_reflection" : "needs_publish_decision",
            programme: evidence.programme,
            priority_score: evidence.status == "needs_validation" ? 88 : 70,
            status_tone: evidence.status == "needs_validation" ? "warm" : "accent",
            changed_since_last_seen: true
          )
        end
      end

      def publishing_actions
        current_stories.first(4).map do |story|
          item(
            title: story.title,
            detail: story.support_prompt.presence || story.summary.to_s.truncate(120),
            href: Ib::RouteBuilder.href_for(story),
            entity_ref: Ib::RouteBuilder.entity_ref_for(story),
            action_type: "family_digest_attention",
            programme: story.programme,
            priority_score: story.state == "needs_context" ? 85 : 68,
            status_tone: story.state == "published" ? "success" : "warm",
            changed_since_last_seen: true
          )
        end
      end

      def coordinator_comments
        current_comments.where(comment_type: %w[review_note return_note]).first(4).map do |comment|
          document = comment.curriculum_document
          item(
            title: document&.title || "Returned item",
            detail: comment.body.truncate(120),
            href: Ib::RouteBuilder.href_for(document),
            entity_ref: Ib::RouteBuilder.entity_ref_for(comment),
            action_type: "coordinator_returned",
            programme: programme_for(document),
            priority_score: 91,
            status_tone: "risk",
            changed_since_last_seen: true
          )
        end
      end

      def projects_core_follow_up
        current_records.first(4).map do |record|
          item(
            title: record.title,
            detail: record.next_action.presence || record.summary.to_s.truncate(120),
            href: Ib::RouteBuilder.href_for(record),
            entity_ref: Ib::RouteBuilder.entity_ref_for(record),
            action_type: action_type_for_record(record),
            programme: record.programme,
            priority_score: risk_score(record),
            status_tone: tone_for_risk(record.risk_level),
            changed_since_last_seen: true
          )
        end
      end

      def quick_actions
        [
          item(title: "Open evidence inbox", detail: "Validate evidence and request reflections.", href: "/ib/evidence", entity_ref: "route:/ib/evidence", action_type: "resume_work", programme: "Mixed", priority_score: 65, status_tone: "accent"),
          item(title: "Open publishing queue", detail: "Preview, schedule, or hold family-ready stories.", href: "/ib/families/publishing", entity_ref: "route:/ib/families/publishing", action_type: "needs_publish_decision", programme: "Mixed", priority_score: 62, status_tone: "success"),
          item(title: "Open review queue", detail: "Handle approvals, returns, and moderation.", href: "/ib/review", entity_ref: "route:/ib/review", action_type: "needs_review", programme: "Mixed", priority_score: 63, status_tone: "warm"),
          item(title: "Duplicate a unit", detail: "Start copy or carry-forward in two steps.", href: "/ib/home#duplicate-document", entity_ref: "route:/ib/home#duplicate-document", action_type: "duplicate_document", programme: "Mixed", priority_score: 61, status_tone: "accent"),
          item(title: "Search IB work", detail: "Find documents, evidence, stories, and milestones fast.", href: "/ib/home#search", entity_ref: "route:/ib/home#search", action_type: "search", programme: "Mixed", priority_score: 60, status_tone: "default")
        ]
      end

      def coordinator_cards
        Operations::PayloadBuilder.new(user: user, school: school).build.fetch(:priority_exceptions)
      end

      def console_extras
        ActionConsoleService.new(user: user, school: school, programme: inferred_programme).build.merge(
          performance_budget: Ib::Support::PerformanceBudgetService.new(tenant: user.tenant, school: school).build
        )
      end

      def item(title:, detail:, href:, entity_ref:, action_type:, programme:, priority_score:, status_tone:, changed_since_last_seen: false)
        {
          id: Digest::SHA256.hexdigest("#{action_type}:#{entity_ref}")[0, 12],
          label: title,
          detail: detail,
          href: href,
          entity_ref: entity_ref,
          action_type: action_type,
          programme: programme.presence_in(PROGRAMMES) || "Mixed",
          priority_score: priority_score,
          tone: status_tone,
          status_tone: status_tone,
          changed_since_last_seen: changed_since_last_seen,
          status: status_tone == "risk" ? "risk" : status_tone == "warm" ? "watch" : "healthy"
        }
      end

      def priority_for_document(document, readiness)
        base = document.status == "pending_approval" ? 86 : 60
        readiness[:ready] ? base : base + 10
      end

      def action_type_for_record(record)
        return "project_milestone_due" if record.due_on.present?
        return "specialist_request" if record.record_family == "specialist"

        "resume_work"
      end

      def risk_score(record)
        case record.risk_level
        when "risk" then 94
        when "watch" then 78
        else 62
        end
      end

      def tone_for_risk(value)
        case value
        when "risk" then "risk"
        when "watch" then "warm"
        else "success"
        end
      end

      def programme_for(document)
        return "Mixed" if document.nil?

        type = document.document_type.to_s
        schema = document.schema_key.to_s
        return "PYP" if type.start_with?("ib_pyp") || schema.include?("ib.pyp")
        return "MYP" if type.start_with?("ib_myp") || schema.include?("ib.myp")
        return "DP" if type.start_with?("ib_dp") || schema.include?("ib.dp")

        "Mixed"
      end
    end
  end
end
