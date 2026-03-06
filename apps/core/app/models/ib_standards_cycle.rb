class IbStandardsCycle < ApplicationRecord
  include TenantScoped

  STATUS_TYPES = %w[open in_review exported archived].freeze

  belongs_to :school
  belongs_to :academic_year, optional: true
  belongs_to :coordinator, class_name: "User", optional: true

  has_many :packets, class_name: "IbStandardsPacket", dependent: :destroy
  has_many :exports, class_name: "IbStandardsExport", dependent: :nullify

  validates :title, presence: true
  validates :status, inclusion: { in: STATUS_TYPES }
end
