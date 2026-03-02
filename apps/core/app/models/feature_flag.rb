class FeatureFlag < ApplicationRecord
  belongs_to :tenant, optional: true

  DEFAULTS = {
    "portfolio_enabled" => true,
    "guardian_portal_enabled" => true,
    "ai_enabled" => true,
    "google_integration" => true,
    "curriculum_profiles_v1" => true,
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
end
