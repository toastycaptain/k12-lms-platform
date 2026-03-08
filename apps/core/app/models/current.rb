class Current < ActiveSupport::CurrentAttributes
  attribute :tenant, :user, :school, :request_id, :correlation_id, :trace_id, :span_id
end
