class FeatureFlag < ApplicationRecord
  IB_PHASE5_REQUIRED_FLAGS = %w[
    curriculum_documents_v1
    school_scoping_v1
    ib_pack_v2
    ib_pack_v2_workflows
    ib_teacher_console_v1
    ib_operations_center_v1
    ib_programme_settings_v1
    ib_evidence_subsystem_v1
    ib_family_publishing_v1
    ib_guardian_calm_mode_v1
    ib_standards_practices_live_v1
  ].freeze

  belongs_to :tenant, optional: true

  DEFAULTS = {
    "portfolio_enabled" => true,
    "guardian_portal_enabled" => true,
    "ai_enabled" => true,
    "google_integration" => true,
    "curriculum_profiles_v1" => true,
    "curriculum_profiles_v2_core" => false,
    "curriculum_pack_lifecycle_v1" => false,
    "curriculum_pack_store_v1" => false,
    "curriculum_document_schema_validation_v1" => false,
    "curriculum_pack_schema_v3" => false,
    "curriculum_pack_workflows_v1" => false,
    "curriculum_documents_v1" => false,
    "school_scoping_v1" => false,
    "generic_frameworks_v1" => false,
    "curriculum_profile_version_pinning_v1" => false,
    "curriculum_resolution_observability_v1" => false,
    "planner_schema_renderer_v1" => false,
    "runtime_nav_composition_v1" => false,
    "profile_derived_surfaces_v1" => false,
    "curriculum_workflow_engine_v1" => false,
    "district_curriculum_governance_v1" => false,
    "integration_curriculum_envelope_v1" => false,
    "curriculum_security_derived_only_v1" => false,
    "ib_pack_v2" => false,
    "ib_pack_v2_workflows" => false,
    "ib_teacher_console_v1" => false,
    "ib_operations_center_v1" => false,
    "ib_programme_settings_v1" => false,
    "ib_evidence_subsystem_v1" => false,
    "ib_family_publishing_v1" => false,
    "ib_guardian_calm_mode_v1" => false,
    "ib_poi_v1" => false,
    "ib_pyp_exhibition_live_v1" => false,
    "ib_interdisciplinary_v1" => false,
    "ib_myp_projects_v1" => false,
    "ib_dp_core_live_v1" => false,
    "ib_standards_practices_live_v1" => false,
    "ib_documents_only_v1" => false,
    "ib_pyp_vertical_slice_v1" => false,
    "ib_myp_vertical_slice_v1" => false,
    "ib_myp_interdisciplinary_slice_v1" => false,
    "ib_myp_projects_slice_v1" => false,
    "ib_myp_service_slice_v1" => false,
    "ib_dp_vertical_slice_v1" => false,
    "ib_dp_ia_slice_v1" => false,
    "ib_dp_ee_slice_v1" => false,
    "ib_dp_tok_slice_v1" => false,
    "ib_dp_cas_slice_v1" => false,
    "new_gradebook" => false,
    "beta_reports" => false
  }.freeze

  validates :key, presence: true
  validates :enabled, inclusion: { in: [ true, false ] }
  validates :key, uniqueness: { scope: :tenant_id }

  scope :global, -> { where(tenant_id: nil) }
  scope :for_tenant, ->(tenant) { where(tenant_id: tenant&.id) }

  def self.enabled?(key, tenant: nil)
    key = key.to_s

    if tenant
      tenant_override = find_by(key: key, tenant_id: tenant.id)
      return tenant_override.enabled unless tenant_override.nil?
    end

    global_override = find_by(key: key, tenant_id: nil)
    return global_override.enabled unless global_override.nil?

    DEFAULTS.fetch(key, false)
  end

  def self.snapshot(keys, tenant: nil)
    Array(keys).index_with { |key| enabled?(key, tenant: tenant) }
  end

  def self.ib_phase5_snapshot(tenant:)
    snapshot(IB_PHASE5_REQUIRED_FLAGS, tenant: tenant)
  end
end
