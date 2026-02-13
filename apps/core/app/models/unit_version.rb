class UnitVersion < ApplicationRecord
  include TenantScoped

  belongs_to :unit_plan
  has_many :unit_version_standards, dependent: :destroy
  has_many :standards, through: :unit_version_standards
  has_many :resource_links, as: :linkable, dependent: :destroy

  validates :version_number, presence: true, uniqueness: { scope: :unit_plan_id }
  validates :title, presence: true
end
