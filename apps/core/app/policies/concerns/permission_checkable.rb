module PermissionCheckable
  extend ActiveSupport::Concern

  private

  def has_permission?(action, resource = nil)
    return false unless user
    return true if user.has_role?(:admin)

    Permission.granted_for(user.roles, resource_name(resource), action)
  end

  def resource_name(explicit_resource)
    return explicit_resource.to_s if explicit_resource.present?

    self.class.name.demodulize.sub("Policy", "").underscore.pluralize
  end
end
