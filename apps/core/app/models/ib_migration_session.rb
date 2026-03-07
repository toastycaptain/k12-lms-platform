class IbMigrationSession < ApplicationRecord
  include TenantScoped

  STATUS_TYPES = %w[disconnected discovered mapped dry_run_complete draft_imported shadow_mode cutover_ready cutover_live rolled_back archived failed].freeze
  SOURCE_SYSTEMS = %w[toddle managebac generic].freeze

  belongs_to :school, optional: true
  belongs_to :academic_year, optional: true
  belongs_to :ib_pilot_profile, optional: true
  belongs_to :initiated_by, class_name: "User", optional: true
  belongs_to :ib_import_batch, optional: true

  validates :source_system, inclusion: { in: SOURCE_SYSTEMS }
  validates :status, :cutover_state, inclusion: { in: STATUS_TYPES }
  validates :session_key, presence: true

  before_validation :normalize_payloads

  private

  def normalize_payloads
    self.source_inventory = {} unless source_inventory.is_a?(Hash)
    self.mapping_summary = {} unless mapping_summary.is_a?(Hash)
    self.dry_run_summary = {} unless dry_run_summary.is_a?(Hash)
    self.reconciliation_summary = {} unless reconciliation_summary.is_a?(Hash)
    self.rollback_summary = {} unless rollback_summary.is_a?(Hash)
    self.metadata = {} unless metadata.is_a?(Hash)
  end
end
