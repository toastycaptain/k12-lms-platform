class AssignmentStandard < ApplicationRecord
  include TenantScoped

  belongs_to :assignment
  belongs_to :standard

  validates :standard_id, uniqueness: { scope: :assignment_id }
end
