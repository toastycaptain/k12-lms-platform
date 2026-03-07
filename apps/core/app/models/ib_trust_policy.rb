class IbTrustPolicy < ApplicationRecord
  include TenantScoped

  STATUS_TYPES = %w[active paused archived].freeze
  AUDIENCE_TYPES = %w[guardian student mixed].freeze
  DELIVERY_MODES = %w[digest immediate mixed].freeze

  belongs_to :school, optional: true
  belongs_to :created_by, class_name: "User", optional: true

  validates :audience, inclusion: { in: AUDIENCE_TYPES }
  validates :status, inclusion: { in: STATUS_TYPES }
  validates :delivery_mode, inclusion: { in: DELIVERY_MODES }
  validates :content_type, :cadence_mode, :approval_mode, presence: true

  before_validation :normalize_payloads

  private

  def normalize_payloads
    self.policy_rules = {} unless policy_rules.is_a?(Hash)
    self.privacy_rules = {} unless privacy_rules.is_a?(Hash)
    self.localization_rules = {} unless localization_rules.is_a?(Hash)
    self.metadata = {} unless metadata.is_a?(Hash)
  end
end
