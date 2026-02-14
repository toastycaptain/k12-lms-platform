class UnitVersionStandard < ApplicationRecord
  include TenantScoped

  belongs_to :unit_version
  belongs_to :standard

  validates :standard_id, uniqueness: { scope: :unit_version_id }
end
