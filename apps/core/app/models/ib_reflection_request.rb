class IbReflectionRequest < ApplicationRecord
  include TenantScoped

  STATUS_TYPES = %w[requested responded approved expired cancelled].freeze

  belongs_to :ib_evidence_item
  belongs_to :requested_by, class_name: "User"
  belongs_to :student, class_name: "User"
  belongs_to :approved_by, class_name: "User", optional: true

  validates :status, inclusion: { in: STATUS_TYPES }
  validates :prompt, presence: true
end
