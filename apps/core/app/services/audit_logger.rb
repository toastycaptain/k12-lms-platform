class AuditLogger
  class << self
    def log(action:, auditable: nil, user: nil, changes: {}, metadata: {}, request: nil)
      attrs = {
        tenant: Current.tenant,
        user: user || Current.user,
        action: action.to_s,
        changes_data: changes,
        metadata: metadata
      }

      if auditable
        attrs[:auditable_type] = auditable.class.name
        attrs[:auditable_id] = auditable.id
      end

      if request
        attrs[:ip_address] = request.remote_ip
        attrs[:user_agent] = request.user_agent
      end

      AuditLog.create!(attrs)
    end
  end
end
