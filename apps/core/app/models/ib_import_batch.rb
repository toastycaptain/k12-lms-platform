require "digest"

class IbImportBatch < ApplicationRecord
  include TenantScoped

  STATUS_TYPES = %w[uploaded staged mapped blocked ready_for_dry_run ready_for_execute executing completed rolled_back failed].freeze
  SOURCE_KINDS = %w[pyp_poi curriculum_document operational_record staff_role].freeze
  SOURCE_FORMATS = %w[csv xlsx].freeze
  SOURCE_SYSTEMS = %w[generic toddle managebac].freeze
  IMPORT_MODES = %w[draft live].freeze

  belongs_to :school
  belongs_to :academic_year, optional: true
  belongs_to :initiated_by, class_name: "User", optional: true
  belongs_to :executed_by, class_name: "User", optional: true

  has_many :rows, class_name: "IbImportRow", dependent: :destroy

  validates :programme, inclusion: { in: IbProgrammeSetting::PROGRAMMES }
  validates :status, inclusion: { in: STATUS_TYPES }
  validates :source_kind, inclusion: { in: SOURCE_KINDS }
  validates :source_format, inclusion: { in: SOURCE_FORMATS }
  validates :source_system, inclusion: { in: SOURCE_SYSTEMS }
  validates :import_mode, inclusion: { in: IMPORT_MODES }
  validates :source_filename, presence: true

  before_validation :normalize_payloads
  before_validation :compute_checksum, if: -> { raw_payload_changed? && raw_payload.present? }

  def stageable?
    %w[uploaded staged mapped blocked ready_for_dry_run].include?(status)
  end

  def executable?
    status == "ready_for_execute"
  end

  private

  def normalize_payloads
    self.scope_metadata = {} unless scope_metadata.is_a?(Hash)
    self.mapping_payload = {} unless mapping_payload.is_a?(Hash)
    self.validation_summary = {} unless validation_summary.is_a?(Hash)
    self.dry_run_summary = {} unless dry_run_summary.is_a?(Hash)
    self.execution_summary = {} unless execution_summary.is_a?(Hash)
    self.rollback_summary = {} unless rollback_summary.is_a?(Hash)
    self.preview_summary = {} unless preview_summary.is_a?(Hash)
    self.rollback_capabilities = {} unless rollback_capabilities.is_a?(Hash)
    self.parser_warnings = Array(parser_warnings)
  end

  def compute_checksum
    self.source_checksum = Digest::SHA256.hexdigest(raw_payload.to_s)
  end
end
