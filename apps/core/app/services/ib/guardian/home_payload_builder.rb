module Ib
  module Guardian
    class HomePayloadBuilder
      def initialize(user:, school: nil)
        @user = user
        @school = school
      end

      def build
        stories = visible_stories
        evidence = visible_evidence
        milestones = visible_milestones
        {
          stories: stories.map { |story| serialize_story(story) },
          released_reports: released_reports,
          current_units: current_units,
          portfolio_highlights: evidence.first(4).map { |item| serialize_evidence(item) },
          calendar_digest: milestones.first(4).map { |record| serialize_milestone(record) },
          milestone_digest: milestones.first(4).map { |record| serialize_milestone(record) },
          progress_summary: {
            story_count: stories.count,
            highlight_count: evidence.count,
            support_prompts: stories.count { |story| story.support_prompt.present? } + milestones.count { |record| guardian_prompt_for(record).present? }
          },
          visibility_policy: ::Ib::Guardian::VisibilityPolicyService.new(user: user, school: school).build,
          current_unit_windows: ::Ib::Guardian::CurrentUnitWindowService.new(user: user, school: school).build,
          student_options: student_options,
          interactions: ::Ib::Guardian::InteractionService.new(user: user, school: school).summary,
          digest_strategy: ::Ib::Guardian::DigestStrategyService.new(user: user, school: school).build,
          delivery_receipts: delivery_receipts,
          family_charter: family_charter,
          how_to_help: how_to_help_cards,
          preferences: guardian_preferences,
          communication_preferences: communication_preferences
        }
      end

      private

      attr_reader :user, :school

      def visible_stories
        scope = IbLearningStory.where(tenant_id: user.tenant_id, state: %w[scheduled published])
        scope = scope.where(school_id: school.id) if school
        scope.order(published_at: :desc, updated_at: :desc)
      end

      def visible_evidence
        scope = IbEvidenceItem.where(tenant_id: user.tenant_id, visibility: %w[guardian_visible family_ready])
        scope = scope.where(school_id: school.id) if school
        scope.order(updated_at: :desc)
      end

      def visible_milestones
        scope = IbOperationalRecord.where(tenant_id: user.tenant_id, programme: %w[MYP DP])
        scope = scope.where(school_id: school.id) if school
        scope = scope.where(record_family: %w[myp_project myp_service dp_ia dp_ee dp_tok dp_cas])
        scope = scope.where("metadata ->> 'guardian_visible' = ? OR due_on IS NOT NULL", "true")
        scope.order(due_on: :asc, updated_at: :desc)
      end

      def current_units
        scope = CurriculumDocument.includes(:current_version).where(tenant_id: user.tenant_id)
        scope = scope.where(school_id: school.id) if school
        scope.order(updated_at: :desc).limit(3).map do |document|
          {
            id: document.id,
            title: document.title,
            href: Ib::RouteBuilder.href_for(document),
            summary: document.current_version&.content&.slice("central_idea", "title", "statement_of_inquiry") || {}
          }
        end
      end

      def serialize_story(story)
        translation = story.translations.order(updated_at: :desc).first
        {
          id: story.id,
          title: story.title,
          programme: story.programme,
          summary: story.summary,
          support_prompt: story.support_prompt,
          cadence: story.cadence,
          state: story.state,
          published_at: story.published_at,
          translation_state: translation&.state || "not_requested",
          available_locales: story.translations.pluck(:locale)
        }
      end

      def serialize_evidence(item)
        {
          id: item.id,
          title: item.title,
          programme: item.programme,
          summary: item.summary,
          visibility: item.visibility
        }
      end

      def serialize_milestone(record)
        {
          id: record.id,
          title: record.title,
          programme: record.programme,
          cadence: guardian_prompt_for(record),
          published_at: record.due_on,
          href: Ib::RouteBuilder.href_for(record)
        }
      end

      def guardian_prompt_for(record)
        prompt = record.metadata.is_a?(Hash) ? record.metadata["guardian_prompt"] : nil
        return prompt if prompt.present?

        record.next_action.presence || record.summary.presence || "#{record.record_family.to_s.tr('_', ' ')} milestone update"
      end

      def student_options
        GuardianLink.active.where(guardian_id: user.id).includes(:student).map do |link|
          {
            id: link.student_id,
            label: user_label(link.student) || "Student ##{link.student_id}",
            relationship: link.relationship
          }
        end.presence || [ { id: user.id, label: user_label(user) || user.email, relationship: "self" } ]
      end

      def family_charter
        {
          principle: "Calm, purposeful, permission-safe family communication.",
          noise_budget: "No more than two routine digests per week without urgent need.",
          moderation: "Teachers can require acknowledgement-only or enable moderated responses."
        }
      end

      def how_to_help_cards
        current_unit_windows.first(3).map do |window|
          {
            id: window[:id],
            title: window[:title],
            prompt: window.dig(:summary, :how_to_help)
          }
        end
      end

      def current_unit_windows
        @current_unit_windows ||= ::Ib::Guardian::CurrentUnitWindowService.new(user: user, school: school).build
      end

      def guardian_preferences
        NotificationPreference.for_user(user).slice("ib_story_published", "message_received", "ib_readiness_blocker")
      end

      def communication_preferences
        record = IbCommunicationPreference.find_or_create_by!(
          tenant: user.tenant,
          school: school,
          user: user,
          audience: "guardian"
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
        scope = IbReport.where(tenant_id: user.tenant_id, audience: %w[guardian conference], status: "released")
        scope = scope.where(school_id: school.id) if school
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
        scope = IbDeliveryReceipt.where(tenant_id: user.tenant_id, user_id: user.id, audience_role: "guardian")
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

      def user_label(value)
        return if value.nil?

        [ value.try(:first_name), value.try(:last_name) ].compact.join(" ").presence || value.try(:email)
      end
    end
  end
end
