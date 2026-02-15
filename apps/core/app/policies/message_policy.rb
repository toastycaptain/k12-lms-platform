class MessagePolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    participant?
  end

  def create?
    participant?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.joins(message_thread: :message_thread_participants)
        .where(message_thread_participants: { user_id: user.id })
        .distinct
    end
  end

  private

  def participant?
    return false unless record.respond_to?(:message_thread_id)

    MessageThreadParticipant.exists?(message_thread_id: record.message_thread_id, user_id: user.id)
  end
end
