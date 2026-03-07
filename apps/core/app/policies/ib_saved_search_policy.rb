# frozen_string_literal: true

class IbSavedSearchPolicy < IbSchoolScopedPolicy
  class Scope < IbSchoolScopedPolicy::Scope
    def resolve
      super.where(user_id: user.id)
    end
  end
end
