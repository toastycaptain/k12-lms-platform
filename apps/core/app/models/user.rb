class User < ApplicationRecord
  include TenantScoped

  encrypts :google_access_token, :google_refresh_token

  has_many :user_roles, dependent: :destroy
  has_many :roles, through: :user_roles

  validates :email, presence: true, uniqueness: { scope: :tenant_id }
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }

  def has_role?(role_name)
    roles.exists?(name: role_name.to_s)
  end

  def add_role(role_name)
    role = tenant.roles.find_or_create_by!(name: role_name.to_s)
    user_roles.find_or_create_by!(role: role)
  end

  def google_connected?
    google_refresh_token.present?
  end
end
