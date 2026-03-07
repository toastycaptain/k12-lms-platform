class IbPilotFeedbackItem < ApplicationRecord
  include TenantScoped

  STATUS_TYPES = %w[new triaged planned resolved archived].freeze
  SENTIMENT_TYPES = %w[positive neutral negative urgent].freeze
  CATEGORY_TYPES = %w[general onboarding migration reporting collaboration speed intelligence trust mobile search].freeze
  ROLE_TYPES = %w[teacher specialist coordinator student guardian admin].freeze

  belongs_to :school, optional: true
  belongs_to :ib_pilot_profile, optional: true
  belongs_to :user, optional: true

  validates :title, presence: true
  validates :status, inclusion: { in: STATUS_TYPES }
  validates :sentiment, inclusion: { in: SENTIMENT_TYPES }
  validates :category, inclusion: { in: CATEGORY_TYPES }
  validates :role_scope, inclusion: { in: ROLE_TYPES }

  before_validation :normalize_payloads

  private

  def normalize_payloads
    self.tags = Array(tags)
    self.routing_payload = {} unless routing_payload.is_a?(Hash)
    self.metadata = {} unless metadata.is_a?(Hash)
  end
end
