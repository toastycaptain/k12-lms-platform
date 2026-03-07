class IbReportTemplate < ApplicationRecord
  include TenantScoped

  STATUS_TYPES = %w[draft active archived].freeze

  belongs_to :school, optional: true
  belongs_to :created_by, class_name: "User", optional: true

  has_many :reports, class_name: "IbReport", dependent: :nullify

  validates :programme, inclusion: { in: IbReport::PROGRAMME_TYPES }
  validates :audience, inclusion: { in: IbReport::AUDIENCE_TYPES }
  validates :name, :family, :schema_version, presence: true
  validates :status, inclusion: { in: STATUS_TYPES }

  before_validation :normalize_payloads

  private

  def normalize_payloads
    self.section_definitions = {} unless section_definitions.is_a?(Hash)
    self.translation_rules = {} unless translation_rules.is_a?(Hash)
    self.metadata = {} unless metadata.is_a?(Hash)
  end
end
