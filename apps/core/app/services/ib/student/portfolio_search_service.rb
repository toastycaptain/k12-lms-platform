module Ib
  module Student
    class PortfolioSearchService
      def initialize(user:, school: nil)
        @user = user
        @school = school
      end

      def build(query: nil)
        evidence = evidence_scope
        if query.present?
          like = "%#{query}%"
          evidence = evidence.where("title ILIKE ? OR summary ILIKE ?", like, like)
        end

        {
          evidence_results: evidence.limit(10).map do |item|
            {
              id: item.id,
              title: item.title,
              detail: item.summary,
              href: Ib::RouteBuilder.href_for(item),
              programme: item.programme
            }
          end,
          collections: collection_scope.limit(8).map do |collection|
            {
              id: collection.id,
              title: collection.title,
              visibility: collection.visibility,
              item_count: Array(collection.item_refs).size,
              shared_token: collection.shared_token
            }
          end
        }
      end

      private

      attr_reader :user, :school

      def evidence_scope
        scope = IbEvidenceItem.where(tenant_id: user.tenant_id, student_id: user.id)
        scope = scope.where(school_id: school.id) if school
        scope.order(updated_at: :desc)
      end

      def collection_scope
        scope = IbPortfolioCollection.where(tenant_id: user.tenant_id, student_id: user.id)
        scope = scope.where(school_id: school.id) if school
        scope.order(updated_at: :desc)
      end
    end
  end
end
