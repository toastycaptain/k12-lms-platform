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
          current_units: current_units,
          portfolio_highlights: evidence.first(4).map { |item| serialize_evidence(item) },
          calendar_digest: milestones.first(4).map { |record| serialize_milestone(record) },
          milestone_digest: milestones.first(4).map { |record| serialize_milestone(record) },
          progress_summary: {
            story_count: stories.count,
            highlight_count: evidence.count,
            support_prompts: stories.count { |story| story.support_prompt.present? } + milestones.count { |record| guardian_prompt_for(record).present? }
          }
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
        {
          id: story.id,
          title: story.title,
          programme: story.programme,
          summary: story.summary,
          support_prompt: story.support_prompt,
          cadence: story.cadence,
          state: story.state,
          published_at: story.published_at
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
    end
  end
end
