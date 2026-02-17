class NotificationPreference < ApplicationRecord
  include TenantScoped

  EMAIL_FREQUENCIES = %w[immediate daily weekly never].freeze
  EVENT_TYPES = {
    "assignment_created" => "Assignment Created",
    "assignment_graded" => "Assignment Graded",
    "assignment_due_soon" => "Assignment Due Soon",
    "announcement_posted" => "Announcement Posted",
    "submission_received" => "Submission Received",
    "quiz_graded" => "Quiz Graded",
    "approval_requested" => "Approval Requested",
    "approval_resolved" => "Approval Resolved",
    "message_received" => "Message Received"
  }.freeze
  DEFAULT_FALLBACK = {
    in_app: true,
    email: false,
    email_frequency: "never"
  }.freeze

  belongs_to :user

  validates :event_type, presence: true, inclusion: { in: EVENT_TYPES.keys }
  validates :email_frequency, presence: true, inclusion: { in: EMAIL_FREQUENCIES }
  validates :user_id, uniqueness: { scope: :event_type }
  validate :email_frequency_matches_email

  scope :for_user_scope, ->(user) { where(user_id: user.id) }

  class << self
    def for_user(user)
      stored = for_user_scope(user).index_by(&:event_type)

      EVENT_TYPES.keys.index_with do |event_type|
        preference = stored[event_type]
        if preference.present?
          preference_payload(preference)
        else
          default_for_event(event_type)
        end
      end
    end

    def preference_for(user, event_type)
      for_user(user)[event_type.to_s] || default_for_event(event_type)
    end

    def default_for_event(event_type)
      return DEFAULT_FALLBACK.dup unless EVENT_TYPES.key?(event_type.to_s)

      {
        in_app: true,
        email: true,
        email_frequency: "immediate"
      }
    end

    def event_name(event_type)
      EVENT_TYPES[event_type.to_s] || event_type.to_s.humanize
    end

    private

    def preference_payload(preference)
      {
        in_app: preference.in_app,
        email: preference.email,
        email_frequency: preference.email_frequency
      }
    end
  end

  private

  def email_frequency_matches_email
    return if email || email_frequency == "never"

    errors.add(:email_frequency, "must be never when email is disabled")
  end
end
