class AuditLogger
  class << self
    def log(event_type:, actor: nil, auditable: nil, metadata: {}, request: nil)
      return if Current.tenant.blank?

      AuditLog.create!(
        tenant: Current.tenant,
        actor: actor || Current.user,
        auditable: auditable,
        event_type: event_type,
        request_id: request&.request_id,
        ip_address: request&.remote_ip,
        user_agent: request&.user_agent,
        metadata: normalize_metadata(metadata)
      )
    rescue StandardError => e
      Rails.logger.error("audit_log_failed event_type=#{event_type} error=#{e.class}: #{e.message}")
      nil
    end

    private

    def normalize_metadata(metadata)
      return {} if metadata.nil?
      return metadata.to_unsafe_h if metadata.respond_to?(:to_unsafe_h)
      return metadata.to_h if metadata.respond_to?(:to_h)

      { value: metadata.to_s }
    end
  end
end
