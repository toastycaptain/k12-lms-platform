class IbSpecialistLibraryItem < ApplicationRecord
  include TenantScoped

  ITEM_TYPES = %w[resource sequence feedback evidence exemplar].freeze
  PROGRAMME_TYPES = %w[PYP MYP DP Mixed].freeze

  belongs_to :school, optional: true
  belongs_to :created_by, class_name: "User"

  validates :title, presence: true
  validates :item_type, inclusion: { in: ITEM_TYPES }
  validates :programme, inclusion: { in: PROGRAMME_TYPES }
end
