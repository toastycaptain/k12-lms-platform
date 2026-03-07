class Notification < ApplicationRecord
  include TenantScoped

  belongs_to :user
  belongs_to :actor, class_name: "User", optional: true
  belongs_to :notifiable, polymorphic: true, optional: true

  validates :notification_type, presence: true
  validates :title, presence: true
  validates :dedupe_key, uniqueness: { scope: [ :tenant_id, :user_id, :notification_type ] }, allow_nil: true

  scope :unread, -> { where(read_at: nil) }
  scope :recent, -> { order(created_at: :desc).limit(20) }

  def read!
    update!(read_at: Time.current) if read_at.nil?
  end

  def read?
    read_at.present?
  end
end
