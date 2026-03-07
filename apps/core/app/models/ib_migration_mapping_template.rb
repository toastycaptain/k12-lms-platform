class IbMigrationMappingTemplate < ApplicationRecord
  include TenantScoped

  STATUS_TYPES = %w[draft active archived].freeze

  belongs_to :school, optional: true
  belongs_to :created_by, class_name: "User", optional: true

  validates :source_system, :name, presence: true
  validates :programme, inclusion: { in: IbProgrammeSetting::PROGRAMMES }
  validates :status, inclusion: { in: STATUS_TYPES }

  before_validation :normalize_payloads

  private

  def normalize_payloads
    self.field_mappings = {} unless field_mappings.is_a?(Hash)
    self.transform_library = {} unless transform_library.is_a?(Hash)
    self.role_mapping_rules = {} unless role_mapping_rules.is_a?(Hash)
    self.metadata = {} unless metadata.is_a?(Hash)
  end
end
