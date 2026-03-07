module Ib
  module Specialist
    class LibraryService
      def initialize(user:, school: nil)
        @user = user
        @school = school
      end

      def build(query: nil)
        scope = IbSpecialistLibraryItem.where(tenant_id: user.tenant_id)
        scope = scope.where(school_id: [ school.id, nil ]) if school
        if query.present?
          like = "%#{query}%"
          scope = scope.where("title ILIKE ? OR summary ILIKE ?", like, like)
        end
        scope.order(updated_at: :desc).limit(12)
      end

      private

      attr_reader :user, :school
    end
  end
end
