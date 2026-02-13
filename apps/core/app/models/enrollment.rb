class Enrollment < ApplicationRecord
  include TenantScoped

  VALID_ROLES = %w[teacher student].freeze

  belongs_to :user
  belongs_to :section

  validates :role, presence: true, inclusion: { in: VALID_ROLES }
  validates :user_id, uniqueness: { scope: :section_id, message: "already enrolled in this section" }
end
