class MessageThreadPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    participant?
  end

  def create?
    true
  end

  def destroy?
    participant?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.joins(:message_thread_participants)
        .where(message_thread_participants: { user_id: user.id })
        .distinct
    end
  end

  private

  def participant?
    MessageThreadParticipant.exists?(message_thread_id: record.id, user_id: user.id)
  end
end
