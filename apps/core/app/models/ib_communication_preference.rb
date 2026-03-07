class IbCommunicationPreference < ApplicationRecord
  include TenantScoped

  AUDIENCE_TYPES = %w[guardian student].freeze
  DIGEST_CADENCE_TYPES = %w[immediate weekly_digest fortnightly monthly].freeze

  belongs_to :school, optional: true
  belongs_to :user

  validates :audience, inclusion: { in: AUDIENCE_TYPES }
  validates :digest_cadence, inclusion: { in: DIGEST_CADENCE_TYPES }
  validates :locale, :quiet_hours_start, :quiet_hours_end, :quiet_hours_timezone, presence: true

  before_validation :normalize_payloads

  private

  def normalize_payloads
    self.delivery_rules = {} unless delivery_rules.is_a?(Hash)
    self.metadata = {} unless metadata.is_a?(Hash)
  end
end
