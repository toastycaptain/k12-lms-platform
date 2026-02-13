class ModuleItem < ApplicationRecord
  include TenantScoped

  VALID_ITEM_TYPES = %w[assignment discussion resource url].freeze

  belongs_to :course_module
  belongs_to :itemable, polymorphic: true, optional: true

  validates :title, presence: true
  validates :item_type, presence: true, inclusion: { in: VALID_ITEM_TYPES }

  scope :ordered, -> { order(:position) }
end
