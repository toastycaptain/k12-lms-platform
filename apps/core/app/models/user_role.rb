class UserRole < ApplicationRecord
  include TenantScoped

  belongs_to :user
  belongs_to :role

  validates :user_id, uniqueness: { scope: :role_id }

  before_validation :set_tenant_from_user, on: :create

  private

  def set_tenant_from_user
    self.tenant ||= user&.tenant
  end
end
