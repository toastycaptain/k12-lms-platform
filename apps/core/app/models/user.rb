class User < ApplicationRecord
  include TenantScoped

  encrypts :google_access_token, :google_refresh_token

  has_many :user_roles, dependent: :destroy
  has_many :roles, through: :user_roles
  has_many :enrollments, dependent: :destroy
  has_many :module_item_completions, dependent: :destroy
  has_many :notifications, dependent: :destroy
  has_many :acted_notifications, class_name: "Notification", foreign_key: :actor_id, inverse_of: :actor, dependent: :nullify
  has_many :message_thread_participants, dependent: :destroy
  has_many :message_threads, through: :message_thread_participants
  has_many :sent_messages, class_name: "Message", foreign_key: :sender_id, inverse_of: :sender, dependent: :destroy

  validates :email, presence: true, uniqueness: { scope: :tenant_id }
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }

  def cached_role_names
    @cached_role_names ||= roles.loaded? ? roles.map(&:name) : roles.pluck(:name)
  end

  def has_role?(role_name)
    cached_role_names.include?(role_name.to_s)
  end

  def add_role(role_name)
    role = tenant.roles.find_or_create_by!(name: role_name.to_s)
    user_roles.find_or_create_by!(role: role)
  end

  def google_connected?
    google_refresh_token.present?
  end
end
