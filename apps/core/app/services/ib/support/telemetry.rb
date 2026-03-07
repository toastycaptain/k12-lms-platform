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
          ActivityEventService.record!(
            tenant: tenant,
            user: user,
            school: school,
            event_name: event,
            event_family: metadata[:event_family] || metadata["event_family"],
            surface: metadata[:surface] || metadata["surface"],
            programme: metadata[:programme] || metadata["programme"],
            route_id: metadata[:route_id] || metadata["route_id"],
            entity_ref: metadata[:entity_ref] || metadata["entity_ref"],
            document_type: metadata[:document_type] || metadata["document_type"],
            metadata: metadata
          )
        end
      end
    end
  end
end
