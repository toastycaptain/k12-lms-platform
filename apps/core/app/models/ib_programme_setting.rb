class IbProgrammeSetting < ApplicationRecord
  include TenantScoped

  PROGRAMMES = %w[Mixed PYP MYP DP].freeze
  CADENCE_MODES = %w[weekly_digest twice_weekly fortnightly monthly immediate].freeze
  REVIEW_OWNER_ROLES = %w[curriculum_lead coordinator teacher advisor].freeze
  DEFAULT_THRESHOLDS = {
    "approval_sla_days" => 5,
    "review_backlog_limit" => 12,
    "publishing_hold_hours" => 48,
    "digest_batch_limit" => 8
  }.freeze

  belongs_to :school, optional: true
  belongs_to :updated_by, class_name: "User", optional: true

  validates :programme, presence: true
  validates :programme, inclusion: { in: PROGRAMMES }
  validates :cadence_mode, presence: true, inclusion: { in: CADENCE_MODES }
  validates :review_owner_role, presence: true, inclusion: { in: REVIEW_OWNER_ROLES }

  before_validation :normalize_payloads

  validate :validate_thresholds

  def scope_level
    school_id.present? ? "school" : "tenant"
  end

  private

  def normalize_payloads
    normalized_thresholds =
      (thresholds.is_a?(Hash) ? thresholds : {}).to_h.transform_values do |value|
        normalize_threshold_value(value)
      end

    self.thresholds = DEFAULT_THRESHOLDS.merge(normalized_thresholds)
    self.metadata = {} unless metadata.is_a?(Hash)
  end

  def validate_thresholds
    return unless thresholds.is_a?(Hash)

    thresholds.each do |key, value|
      numeric = begin
        Float(value)
      rescue StandardError
        nil
      end
      errors.add(:thresholds, "#{key} must be numeric") if numeric.nil?
      errors.add(:thresholds, "#{key} must be non-negative") if numeric && numeric.negative?
    end
  end

  def normalize_threshold_value(value)
    numeric = Float(value)
    numeric % 1 == 0 ? numeric.to_i : numeric
  rescue StandardError
    value
  end
end
