module Ib
  module Evidence
    class InboxSummaryService
      def initialize(user:, school: nil)
        @user = user
        @school = school
      end

      def build(scope:)
        {
          counts: {
            total: scope.count,
            needs_validation: scope.where(status: "needs_validation").count,
            reflection_requested: scope.where(status: "reflection_requested").count,
            linked_to_story: scope.where(status: "linked_to_story").count,
            family_ready: scope.where(visibility: "family_ready").count,
            unlinked: scope.left_joins(:story_links).where(ib_learning_story_evidence_items: { id: nil }).count
          },
          recent_changes: scope.order(updated_at: :desc).limit(5).map do |item|
            {
              id: item.id,
              title: item.title,
              status: item.status,
              visibility: item.visibility,
              href: ::Ib::RouteBuilder.href_for(item),
              route_id: ::Ib::RouteBuilder.route_id_for(item),
              entity_ref: ::Ib::RouteBuilder.entity_ref_for(item),
              changed_since_last_seen: item.updated_at > 3.days.ago,
              updated_at: item.updated_at.iso8601
            }
          end
        }
      end

      private

      attr_reader :user, :school
    end
  end
end
