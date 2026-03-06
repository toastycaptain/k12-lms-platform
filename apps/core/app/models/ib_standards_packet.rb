class IbStandardsPacket < ApplicationRecord
  include TenantScoped

  REVIEW_STATES = %w[draft in_review approved returned].freeze
  EVIDENCE_STRENGTHS = %w[emerging established strong].freeze
  EXPORT_STATUSES = %w[not_ready ready exported].freeze

  belongs_to :school
  belongs_to :ib_standards_cycle
  belongs_to :owner, class_name: "User", optional: true
  belongs_to :reviewer, class_name: "User", optional: true

  has_many :items, class_name: "IbStandardsPacketItem", dependent: :destroy
  has_many :exports, class_name: "IbStandardsExport", dependent: :destroy

  validates :code, :title, presence: true
  validates :review_state, inclusion: { in: REVIEW_STATES }
  validates :evidence_strength, inclusion: { in: EVIDENCE_STRENGTHS }
  validates :export_status, inclusion: { in: EXPORT_STATUSES }

  def score_summary
    Ib::Standards::ScoringService.packet_summary(self)
  end
end
