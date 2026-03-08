class IbOperationalJob < ApplicationRecord
  include TenantScoped

  STATUS_TYPES = %w[queued running succeeded failed dead_letter cancelled recovered].freeze

  belongs_to :school, optional: true
  belongs_to :source_record, polymorphic: true, optional: true

  has_many :events, class_name: "IbOperationalJobEvent", dependent: :destroy

  validates :operation_key, :job_class, :queue_name, presence: true
  validates :status, inclusion: { in: STATUS_TYPES }

  before_validation :normalize_payloads

  scope :active, -> { where(status: %w[queued running]) }
  scope :attention_needed, -> { where(status: %w[failed dead_letter]) }

  def dead_lettered?
    status == "dead_letter"
  end

  def recoverable?
    status.in?(%w[failed dead_letter cancelled])
  end

  private

  def normalize_payloads
    self.retry_policy = {} unless retry_policy.is_a?(Hash)
    self.payload = {} unless payload.is_a?(Hash)
    self.metrics = {} unless metrics.is_a?(Hash)
    self.trace_context = {} unless trace_context.is_a?(Hash)
  end
end
