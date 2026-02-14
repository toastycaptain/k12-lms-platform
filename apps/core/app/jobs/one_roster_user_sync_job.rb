class OneRosterUserSyncJob < ApplicationJob
  queue_as :default

  ROLE_MAPPING = {
    "teacher" => "teacher",
    "student" => "student",
    "administrator" => "admin"
  }.freeze

  def perform(integration_config_id, triggered_by_id = nil)
    config = IntegrationConfig.unscoped.find(integration_config_id)
    Current.tenant = config.tenant
    triggered_by = triggered_by_id ? User.find(triggered_by_id) : nil

    sync_run = SyncRun.create!(
      tenant: config.tenant,
      integration_config: config,
      sync_type: "oneroster_user_sync",
      direction: "pull",
      triggered_by: triggered_by
    )
    sync_run.start!

    begin
      client = config.one_roster_client

      users = client.get_all_users

      processed = 0
      succeeded = 0
      failed = 0

      users.each do |or_user|
        processed += 1
        begin
          email = or_user["email"]
          unless email.present?
            sync_run.log_warn("Skipping user without email", external_id: or_user["sourcedId"])
            next
          end

          mapping = SyncMapping.find_external(config, "oneroster_user", or_user["sourcedId"])

          if mapping
            user = User.find(mapping.local_id)
            user.update!(
              first_name: or_user["givenName"],
              last_name: or_user["familyName"],
              email: email
            )
            mapping.update!(last_synced_at: Time.current)
            sync_run.log_info("Updated user", entity_type: "User", entity_id: user.id, external_id: or_user["sourcedId"])
          else
            user = User.find_by(email: email) || User.create!(
              first_name: or_user["givenName"],
              last_name: or_user["familyName"],
              email: email,
              tenant: config.tenant
            )
            SyncMapping.create!(
              tenant: config.tenant,
              integration_config: config,
              local_type: "User",
              local_id: user.id,
              external_id: or_user["sourcedId"],
              external_type: "oneroster_user",
              last_synced_at: Time.current
            )
            sync_run.log_info("Created user", entity_type: "User", entity_id: user.id, external_id: or_user["sourcedId"])
          end

          # Assign roles
          or_role = or_user["role"]
          local_role = ROLE_MAPPING[or_role]
          user.add_role(local_role) if local_role

          succeeded += 1
        rescue => e
          failed += 1
          sync_run.log_error("Failed to sync user: #{e.message}", external_id: or_user["sourcedId"])
        end
      end

      sync_run.update!(records_processed: processed, records_succeeded: succeeded, records_failed: failed)
      sync_run.complete!
    rescue => e
      sync_run.fail!(e.message)
      raise
    end
  end
end
