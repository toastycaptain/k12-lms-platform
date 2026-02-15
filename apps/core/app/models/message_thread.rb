class MessageThread < ApplicationRecord
  include TenantScoped

  VALID_TYPES = %w[direct course group].freeze

  belongs_to :course, optional: true
  has_many :message_thread_participants, dependent: :destroy
  has_many :participants, through: :message_thread_participants, source: :user
  has_many :messages, dependent: :destroy

  validates :subject, presence: true
  validates :thread_type, presence: true, inclusion: { in: VALID_TYPES }

  def last_message
    messages.order(created_at: :desc).first
  end

  def unread_count_for(user)
    participant = message_thread_participants.find_by(user: user)
    return messages.count unless participant&.last_read_at

    messages.where("created_at > ?", participant.last_read_at).count
  end
end
