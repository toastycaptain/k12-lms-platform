class IbReflectionRequest < ApplicationRecord
  include TenantScoped

  STATUS_TYPES = %w[requested responded expired cancelled].freeze

  belongs_to :ib_evidence_item
  belongs_to :requested_by, class_name: "User"
  belongs_to :student, class_name: "User"

  validates :status, inclusion: { in: STATUS_TYPES }
  validates :prompt, presence: true
end
