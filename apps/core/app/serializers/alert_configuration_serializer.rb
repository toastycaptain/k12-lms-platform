class AlertConfigurationSerializer < ActiveModel::Serializer
  attributes :id,
    :tenant_id,
    :name,
    :metric,
    :comparison,
    :threshold,
    :severity,
    :enabled,
    :notification_channel,
    :notification_target,
    :cooldown_minutes,
    :last_triggered_at,
    :trigger_count,
    :created_at,
    :updated_at
end
