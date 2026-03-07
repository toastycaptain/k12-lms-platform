class IbImportRow < ApplicationRecord
  include TenantScoped

  STATUS_TYPES = %w[staged mapped blocked ready executed rolled_back skipped failed].freeze

  belongs_to :ib_import_batch

  validates :status, inclusion: { in: STATUS_TYPES }
  validates :row_index, presence: true

  before_validation :normalize_payloads

  private

  def normalize_payloads
    self.source_payload = {} unless source_payload.is_a?(Hash)
    self.normalized_payload = {} unless normalized_payload.is_a?(Hash)
    self.mapping_payload = {} unless mapping_payload.is_a?(Hash)
    self.warnings = Array(warnings)
    self.error_messages = Array(error_messages)
    self.conflict_payload = {} unless conflict_payload.is_a?(Hash)
    self.execution_payload = {} unless execution_payload.is_a?(Hash)
  end
end
