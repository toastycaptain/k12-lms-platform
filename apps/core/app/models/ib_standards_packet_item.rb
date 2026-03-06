class IbStandardsPacketItem < ApplicationRecord
  include TenantScoped

  REVIEW_STATES = %w[draft curated approved].freeze

  belongs_to :ib_standards_packet

  validates :source_type, :source_id, presence: true
  validates :review_state, inclusion: { in: REVIEW_STATES }
end
