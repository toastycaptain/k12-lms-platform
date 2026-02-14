class OneRosterUserSyncJob < ApplicationJob
  queue_as :default

  def perform(integration_config_id, user_id)
    config = IntegrationConfig.unscoped.find(integration_config_id)
    Current.tenant = config.tenant
    user = User.find(user_id)

    sync_run = SyncRun.create!(
      tenant: config.tenant,
      integration_config: config,
      sync_type: "roster_sync",
      direction: "pull",
      triggered_by: user
    )
    sync_run.start!

    begin
      client = OneRosterClient.new(config)
      users = client.list_users

      processed = 0
      succeeded = 0
      failed = 0

      users.each do |or_user|
        processed += 1
        begin
          mapping = SyncMapping.find_external(config, "one_roster_user", or_user["sourcedId"])

          if mapping
            local_user = User.find(mapping.local_id)
            local_user.update!(
              first_name: or_user["givenName"],
              last_name: or_user["familyName"],
              email: or_user["email"]
            )
            sync_run.log_info("Updated user", entity_type: "User", entity_id: local_user.id, external_id: or_user["sourcedId"])
          else
            local_user = User.create!(
              tenant: config.tenant,
              first_name: or_user["givenName"],
              last_name: or_user["familyName"],
              email: or_user["email"]
            )
            SyncMapping.create!(
              tenant: config.tenant,
              integration_config: config,
              local_type: "User",
              local_id: local_user.id,
              external_id: or_user["sourcedId"],
              external_type: "one_roster_user",
              last_synced_at: Time.current
            )
            sync_run.log_info("Created user", entity_type: "User", entity_id: local_user.id, external_id: or_user["sourcedId"])
          end

          mapping&.update!(last_synced_at: Time.current)
          succeeded += 1
        rescue => e
          failed += 1
          sync_run.log_error("Failed to sync user: #{e.message}", external_id: or_user["sourcedId"])
        end
      end

      sync_run.update!(
        records_processed: sync_run.records_processed + processed,
        records_succeeded: sync_run.records_succeeded + succeeded,
        records_failed: sync_run.records_failed + failed
      )

      sync_run.complete!
    rescue => e
      sync_run.fail!(e.message)
      raise
    end
  end
end
