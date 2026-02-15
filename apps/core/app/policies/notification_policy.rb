# frozen_string_literal: true

class NotificationPolicy < ApplicationPolicy
  def index?
    true
  end

  def unread_count?
    true
  end

  def mark_all_read?
    true
  end

  def show?
    owns_notification?
  end

  def update?
    owns_notification?
  end

  def read?
    owns_notification?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.where(user_id: user.id)
    end
  end

  private

  def owns_notification?
    record.user_id == user.id
  end
end
