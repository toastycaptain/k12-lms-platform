module Auditable
  extend ActiveSupport::Concern

  included do
    after_action :audit_create, only: :create, if: -> { response.successful? }
    after_action :audit_update, only: :update, if: -> { response.successful? }
    after_action :audit_destroy, only: :destroy, if: -> { response.successful? }
  end

  private

  def audit_create
    return unless auditable_resource

    AuditLogger.log(
      action: :create,
      auditable: auditable_resource,
      changes: auditable_resource.attributes,
      request: request
    )
  end

  def audit_update
    return unless auditable_resource

    AuditLogger.log(
      action: :update,
      auditable: auditable_resource,
      changes: auditable_resource.previous_changes,
      request: request
    )
  end

  def audit_destroy
    return unless auditable_resource

    AuditLogger.log(
      action: :destroy,
      auditable: auditable_resource,
      request: request
    )
  end

  def auditable_resource
    nil
  end
end
