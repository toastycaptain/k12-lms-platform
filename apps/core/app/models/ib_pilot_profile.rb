class IbPilotProfile < ApplicationRecord
  include TenantScoped

  STATUS_TYPES = %w[draft active paused closed archived].freeze
  ARCHETYPE_TYPES = %w[small_pyp continuum dp_heavy specialist_heavy].freeze
  PROGRAMME_TYPES = %w[PYP MYP DP Mixed].freeze

  belongs_to :school, optional: true
  belongs_to :academic_year, optional: true
  belongs_to :created_by, class_name: "User", optional: true

  has_many :baseline_snapshots, class_name: "IbPilotBaselineSnapshot", dependent: :destroy
  has_many :feedback_items, class_name: "IbPilotFeedbackItem", dependent: :nullify
  has_many :migration_sessions, class_name: "IbMigrationSession", dependent: :nullify
  has_many :benchmark_snapshots, class_name: "IbBenchmarkSnapshot", dependent: :nullify
  has_many :replacement_readiness_snapshots, class_name: "IbReplacementReadinessSnapshot", dependent: :nullify

  validates :name, :cohort_key, :archetype_key, presence: true
  validates :status, inclusion: { in: STATUS_TYPES }
  validates :archetype_key, inclusion: { in: ARCHETYPE_TYPES }
  validates :programme_scope, inclusion: { in: PROGRAMME_TYPES }

  before_validation :normalize_payloads

  private

  def normalize_payloads
    self.role_success_metrics = {} unless role_success_metrics.is_a?(Hash)
    self.baseline_summary = {} unless baseline_summary.is_a?(Hash)
    self.readiness_summary = {} unless readiness_summary.is_a?(Hash)
    self.rollout_bundle = {} unless rollout_bundle.is_a?(Hash)
    self.metadata = {} unless metadata.is_a?(Hash)
  end
end
