class UserRole < ApplicationRecord
  include TenantScoped

  belongs_to :user
  belongs_to :role

  validates :user_id, uniqueness: { scope: :role_id }

  private

  def set_tenant
    self.tenant ||= user&.tenant
  end
end
