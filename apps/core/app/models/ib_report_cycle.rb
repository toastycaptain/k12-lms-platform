class IbReportCycle < ApplicationRecord
  include TenantScoped

  STATUS_TYPES = %w[draft open proofing approved scheduled delivered archived].freeze

  belongs_to :school, optional: true
  belongs_to :academic_year, optional: true
  belongs_to :created_by, class_name: "User", optional: true
  belongs_to :owner, class_name: "User", optional: true

  has_many :reports, class_name: "IbReport", dependent: :nullify

  validates :programme, inclusion: { in: IbReport::PROGRAMME_TYPES }
  validates :cycle_key, presence: true
  validates :status, inclusion: { in: STATUS_TYPES }

  before_validation :normalize_payloads

  private

  def normalize_payloads
    self.delivery_window = {} unless delivery_window.is_a?(Hash)
    self.localization_settings = {} unless localization_settings.is_a?(Hash)
    self.approval_summary = {} unless approval_summary.is_a?(Hash)
    self.metrics = {} unless metrics.is_a?(Hash)
    self.metadata = {} unless metadata.is_a?(Hash)
  end
end
