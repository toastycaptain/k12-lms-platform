class ModuleItem < ApplicationRecord
  include TenantScoped

  VALID_ITEM_TYPES = %w[assignment quiz discussion resource resource_link url text_header].freeze

  belongs_to :course_module
  belongs_to :itemable, polymorphic: true, optional: true
  has_many :module_item_completions, dependent: :destroy

  validates :title, presence: true
  validates :item_type, presence: true, inclusion: { in: VALID_ITEM_TYPES }

  scope :ordered, -> { order(:position) }
end
