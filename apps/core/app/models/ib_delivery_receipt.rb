class IbDeliveryReceipt < ApplicationRecord
  include TenantScoped

  STATE_TYPES = %w[delivered read acknowledged].freeze

  belongs_to :school, optional: true
  belongs_to :user, optional: true

  validates :deliverable_type, :deliverable_id, :audience_role, presence: true
  validates :state, inclusion: { in: STATE_TYPES }

  before_validation :normalize_payloads

  scope :for_deliverable, ->(type, id) { where(deliverable_type: type, deliverable_id: id) }

  private

  def normalize_payloads
    self.metadata = {} unless metadata.is_a?(Hash)
  end
end
