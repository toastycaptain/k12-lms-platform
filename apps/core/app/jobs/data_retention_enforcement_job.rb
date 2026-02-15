class DataRetentionEnforcementJob < ApplicationJob
  queue_as :default

  def perform(policy_id = nil)
    policies = if policy_id.present?
      DataRetentionPolicy.unscoped.where(id: policy_id, enabled: true)
    else
      DataRetentionPolicy.unscoped.where(enabled: true)
    end

    policies.find_each do |policy|
      enforce_policy(policy)
    end
  ensure
    Current.tenant = nil
    Current.user = nil
  end

  private

  def enforce_policy(policy)
    Current.tenant = policy.tenant
    Current.user = policy.created_by

    model_class = policy.entity_type.safe_constantize
    unless model_class
      AuditLogger.log(
        event_type: "retention.policy_failed",
        actor: policy.created_by,
        auditable: policy,
        metadata: { reason: "unknown_entity_type", entity_type: policy.entity_type }
      )
      return
    end

    cutoff = Time.current - policy.retention_days.days
    relation = model_class.unscoped.where(tenant_id: policy.tenant_id).where("created_at < ?", cutoff)
    affected_count = relation.count
    return if affected_count.zero?

    AuditLogger.log(
      event_type: "retention.policy_enforced",
      actor: policy.created_by,
      auditable: policy,
      metadata: {
        entity_type: policy.entity_type,
        action: policy.action,
        retention_days: policy.retention_days,
        affected_count: affected_count
      }
    )

    case policy.action
    when "delete"
      relation.delete_all
    when "archive"
      archive_records(model_class, relation)
    when "anonymize"
      anonymize_records(model_class, relation)
    else
      AuditLogger.log(
        event_type: "retention.policy_failed",
        actor: policy.created_by,
        auditable: policy,
        metadata: { reason: "unsupported_action", action: policy.action }
      )
    end
  end

  def archive_records(model_class, relation)
    unless model_class.column_names.include?("archived_at")
      AuditLogger.log(
        event_type: "retention.policy_failed",
        metadata: {
          reason: "archived_at_missing",
          entity_type: model_class.name
        }
      )
      return
    end

    updates = { archived_at: Time.current }
    updates[:updated_at] = Time.current if model_class.column_names.include?("updated_at")
    relation.update_all(updates)
  end

  def anonymize_records(model_class, relation)
    updates = {}
    redact_columns(model_class).each do |column_name, value|
      updates[column_name] = value
    end
    updates[:updated_at] = Time.current if model_class.column_names.include?("updated_at")
    return if updates.empty?

    relation.update_all(updates)
  end

  def redact_columns(model_class)
    columns = model_class.column_names

    {
      "first_name" => "[REDACTED]",
      "last_name" => "[REDACTED]",
      "name" => "[REDACTED]",
      "title" => "[REDACTED]",
      "description" => "[REDACTED]",
      "comments" => "[REDACTED]",
      "feedback" => "[REDACTED]",
      "body" => "[REDACTED]",
      "message" => "[REDACTED]",
      "user_agent" => "[REDACTED]",
      "ip_address" => "0.0.0.0",
      "email" => "redacted@example.invalid",
      "metadata" => {},
      "context" => {},
      "settings" => {}
    }.select { |column_name, _| columns.include?(column_name) }
  end
end
