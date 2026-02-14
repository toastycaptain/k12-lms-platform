module RlsTenant
  extend ActiveSupport::Concern

  class << self
    def enabled?
      ENV.fetch("ENABLE_RLS", "false") == "true"
    end

    def set_current_tenant(tenant_id)
      return unless enabled?

      ActiveRecord::Base.connection.execute(
        ActiveRecord::Base.sanitize_sql([ "SET LOCAL app.current_tenant_id = ?", tenant_id.to_s ])
      )
    end
  end
end
