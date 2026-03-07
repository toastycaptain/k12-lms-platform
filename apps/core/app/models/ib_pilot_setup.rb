class IbPilotSetup < ApplicationRecord
  include TenantScoped

  STATUS_TYPES = %w[not_started in_progress blocked ready_for_validation ready_for_pilot active paused retired].freeze
  PROGRAMMES = IbProgrammeSetting::PROGRAMMES

  belongs_to :school
  belongs_to :created_by, class_name: "User", optional: true
  belongs_to :updated_by, class_name: "User", optional: true

  validates :programme, inclusion: { in: PROGRAMMES }
  validates :status, inclusion: { in: STATUS_TYPES }

  before_validation :normalize_payloads

  def paused?
    status == "paused"
  end

  def active?
    status == "active"
  end

  private

  def normalize_payloads
    self.feature_flag_bundle = {} unless feature_flag_bundle.is_a?(Hash)
    self.setup_steps = {} unless setup_steps.is_a?(Hash)
    self.owner_assignments = {} unless owner_assignments.is_a?(Hash)
    self.status_details = {} unless status_details.is_a?(Hash)
    self.baseline_metadata = {} unless baseline_metadata.is_a?(Hash)
  end
end
