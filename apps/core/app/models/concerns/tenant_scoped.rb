module TenantScoped
  extend ActiveSupport::Concern

  included do
    belongs_to :tenant, optional: false

    default_scope -> { where(tenant_id: Current.tenant&.id) if Current.tenant }

    before_validation :set_tenant, on: :create

    validates :tenant_id, presence: true
  end

  private

  def set_tenant
    self.tenant ||= Current.tenant
  end
end
