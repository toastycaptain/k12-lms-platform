class MessageThreadParticipant < ApplicationRecord
  include TenantScoped

  belongs_to :message_thread
  belongs_to :user

  validates :user_id, uniqueness: { scope: :message_thread_id }

  def mark_read!
    update!(last_read_at: Time.current)
  end
end
