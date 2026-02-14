class DataRetentionEnforcementJob < ApplicationJob
  queue_as :default

  ENTITY_TYPE_MAP = {
    "audit_log" => AuditLog,
    "sync_log" => SyncLog,
    "ai_invocation" => AiInvocation
  }.freeze

  def perform(policy_id)
    policy = DataRetentionPolicy.unscoped.find(policy_id)
    Current.tenant = Tenant.find(policy.tenant_id)

    klass = ENTITY_TYPE_MAP[policy.entity_type]
    return unless klass

    cutoff = policy.retention_days.days.ago
    records = klass.where("created_at < ?", cutoff)

    case policy.action
    when "delete"
      count = 0
      records.find_each(batch_size: 1000) do |record|
        record.destroy
        count += 1
      end
      log_enforcement(policy, "deleted", count)
    when "archive"
      count = 0
      if klass.column_names.include?("archived_at")
        records.where(archived_at: nil).find_each(batch_size: 1000) do |record|
          record.update_columns(archived_at: Time.current)
          count += 1
        end
      end
      log_enforcement(policy, "archived", count)
    when "anonymize"
      count = 0
      if klass.column_names.include?("user_id")
        records.where.not(user_id: nil).find_each(batch_size: 1000) do |record|
          record.update_columns(user_id: nil)
          count += 1
        end
      end
      log_enforcement(policy, "anonymized", count)
    end
  ensure
    Current.tenant = nil
  end

  private

  def log_enforcement(policy, action_taken, count)
    AuditLogger.log(
      action: :destroy,
      auditable: policy,
      metadata: { enforcement_action: action_taken, records_processed: count },
      user: nil
    )
  rescue => e
    Rails.logger.error("Failed to log enforcement: #{e.message}")
  end
end
