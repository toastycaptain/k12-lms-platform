class IbOperationalRecord < ApplicationRecord
  include TenantScoped

  PRIORITY_TYPES = %w[low normal high urgent].freeze
  RISK_TYPES = %w[healthy watch risk].freeze

  belongs_to :school
  belongs_to :planning_context, optional: true
  belongs_to :curriculum_document, optional: true
  belongs_to :student, class_name: "User", optional: true
  belongs_to :owner, class_name: "User", optional: true
  belongs_to :advisor, class_name: "User", optional: true

  has_many :checkpoints, class_name: "IbOperationalCheckpoint", dependent: :destroy

  validates :record_family, :subtype, :title, :status, :programme, presence: true
  validates :priority, inclusion: { in: PRIORITY_TYPES }
  validates :risk_level, inclusion: { in: RISK_TYPES }
end
