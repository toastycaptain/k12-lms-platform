class IbActivityEvent < ApplicationRecord
  include TenantScoped

  PROGRAMME_TYPES = %w[PYP MYP DP Mixed].freeze

  belongs_to :school, optional: true
  belongs_to :user, optional: true

  validates :event_name, :event_family, :surface, :occurred_at, presence: true
  validates :programme, inclusion: { in: PROGRAMME_TYPES }
  validates :dedupe_key, uniqueness: { scope: :tenant_id }, allow_nil: true

  scope :recent, -> { order(occurred_at: :desc, id: :desc) }
  scope :for_programme, ->(programme) { where(programme: programme) if programme.present? }
  scope :for_family, ->(event_family) { where(event_family: event_family) if event_family.present? }
end
