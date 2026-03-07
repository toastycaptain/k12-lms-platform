# frozen_string_literal: true

class IbUserWorkspacePreferencePolicy < IbSchoolScopedPolicy
  def show?
    record.user_id == user.id || privileged_user?
  end

  def update?
    show?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scoped = scope.where(tenant_id: user.tenant_id)
      scoped = scoped.where(user_id: user.id) unless privileged_user?
      if Current.respond_to?(:school) && Current.school && scope.column_names.include?("school_id")
        scoped = scoped.where(school_id: [ Current.school.id, nil ])
      end
      scoped
    end
  end
end
