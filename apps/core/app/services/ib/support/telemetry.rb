module Ib
  module Support
    class Telemetry
      class << self
        def emit(event:, tenant:, user: nil, school: nil, metadata: {})
          payload = {
            event: event,
            tenant_id: tenant&.id,
            user_id: user&.id,
            school_id: school&.id,
            metadata: metadata,
            occurred_at: Time.current.utc.iso8601
          }
          Rails.logger.info("[ib.telemetry] #{payload.to_json}")
        end
      end
    end
  end
end
