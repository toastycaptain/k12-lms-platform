class Role < ApplicationRecord
  include TenantScoped

  VALID_ROLES = %w[admin curriculum_lead teacher student guardian].freeze

  has_many :user_roles, dependent: :destroy
  has_many :users, through: :user_roles
  has_many :permissions, dependent: :destroy

  validates :name, presence: true, uniqueness: { scope: :tenant_id }
  validates :name, inclusion: { in: VALID_ROLES }
end
