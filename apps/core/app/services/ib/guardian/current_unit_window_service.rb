module Ib
  module Guardian
    class CurrentUnitWindowService
      def initialize(user:, school: nil)
        @user = user
        @school = school
      end

      def build
        scope = CurriculumDocument.includes(:current_version).where(tenant_id: user.tenant_id)
        scope = scope.where(school_id: school.id) if school
        scope.order(updated_at: :desc).limit(3).map do |document|
          content = document.current_version&.content || {}
          {
            id: document.id,
            title: document.title,
            href: Ib::RouteBuilder.href_for(document),
            summary: {
              big_idea: content["central_idea"] || content["statement_of_inquiry"] || content["transdisciplinary_theme"],
              current_focus: content["learning_goal"] || content["focus"],
              how_to_help: content["family_support_prompt"] || "Ask what changed in today’s learning and why."
            }
          }
        end
      end

      private

      attr_reader :user, :school
    end
  end
end
