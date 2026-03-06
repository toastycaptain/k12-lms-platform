class IbStandardsExport < ApplicationRecord
  include TenantScoped

  STATUS_TYPES = %w[queued running succeeded failed].freeze

  belongs_to :school
  belongs_to :ib_standards_cycle, optional: true
  belongs_to :ib_standards_packet
  belongs_to :initiated_by, class_name: "User"

  has_one_attached :artifact

  validates :status, inclusion: { in: STATUS_TYPES }
end
