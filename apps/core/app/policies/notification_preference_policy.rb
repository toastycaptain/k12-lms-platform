# frozen_string_literal: true

class NotificationPreferencePolicy < ApplicationPolicy
  def index?
    user.present?
  end

  def update?
    return false unless user.present?
    return true if record.is_a?(Class)

    record.user_id == user.id
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.where(user_id: user.id)
    end
  end
end
