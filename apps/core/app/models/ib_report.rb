class IbReport < ApplicationRecord
  include TenantScoped

  PROGRAMME_TYPES = %w[PYP MYP DP Mixed].freeze
  AUDIENCE_TYPES = %w[internal teacher coordinator student guardian conference].freeze
  STATUS_TYPES = %w[draft in_review signed_off released archived].freeze

  belongs_to :school, optional: true
  belongs_to :academic_year, optional: true
  belongs_to :student, class_name: "User", optional: true
  belongs_to :author, class_name: "User", optional: true

  has_many :versions, class_name: "IbReportVersion", dependent: :destroy
  has_many :deliveries, class_name: "IbReportDelivery", dependent: :destroy

  validates :programme, inclusion: { in: PROGRAMME_TYPES }
  validates :audience, inclusion: { in: AUDIENCE_TYPES }
  validates :status, inclusion: { in: STATUS_TYPES }
  validates :report_family, :title, presence: true

  before_validation :normalize_payloads

  def current_version
    versions.order(version_number: :desc, id: :desc).first
  end

  private

  def normalize_payloads
    self.source_refs = Array(source_refs)
    self.proofing_summary = {} unless proofing_summary.is_a?(Hash)
    self.metadata = {} unless metadata.is_a?(Hash)
  end
end
