class OneRosterAutoSyncJob < ApplicationJob
  queue_as :default

  DEFAULT_SYNC_INTERVAL_HOURS = 24
  ONE_ROSTER_SYNC_TYPES = %w[oneroster_org_sync oneroster_user_sync].freeze
  ACTIVE_SYNC_STATUSES = %w[pending running].freeze

  def perform
    IntegrationConfig.unscoped
      .where(provider: "oneroster", status: "active")
      .find_each do |config|
      next unless auto_sync_enabled?(config)
      next if sync_in_progress?(config)
      next unless due_for_sync?(config)

      OneRosterOrgSyncJob.perform_later(config.id)
      OneRosterUserSyncJob.perform_later(config.id)
      log_auto_sync_trigger(config)
    end
  ensure
    Current.tenant = nil
    Current.user = nil
  end

  private

  def auto_sync_enabled?(config)
    settings = config.settings.is_a?(Hash) ? config.settings : {}
    settings["auto_sync_enabled"] == true
  end

  def sync_in_progress?(config)
    SyncRun.unscoped.where(
      integration_config_id: config.id,
      sync_type: ONE_ROSTER_SYNC_TYPES,
      status: ACTIVE_SYNC_STATUSES
    ).exists?
  end

  def due_for_sync?(config)
    last_sync_at = SyncRun.unscoped.where(
      integration_config_id: config.id,
      sync_type: ONE_ROSTER_SYNC_TYPES
    ).maximum(:created_at)
    return true if last_sync_at.blank?

    Time.current >= last_sync_at + sync_interval_for(config).hours
  end

  def sync_interval_for(config)
    settings = config.settings.is_a?(Hash) ? config.settings : {}
    configured = settings["sync_interval_hours"].to_i
    configured.positive? ? configured : DEFAULT_SYNC_INTERVAL_HOURS
  end

  def log_auto_sync_trigger(config)
    Current.tenant = config.tenant
    AuditLogger.log(
      event_type: "integration.oneroster_auto_sync_triggered",
      auditable: config,
      metadata: {
        integration_config_id: config.id,
        sync_interval_hours: sync_interval_for(config)
      }
    )
  end
end
