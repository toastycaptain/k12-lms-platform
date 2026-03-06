class IbOperationalCheckpoint < ApplicationRecord
  include TenantScoped

  STATUS_TYPES = %w[pending in_progress completed blocked].freeze

  belongs_to :ib_operational_record
  belongs_to :reviewer, class_name: "User", optional: true

  validates :title, presence: true
  validates :status, inclusion: { in: STATUS_TYPES }
end
