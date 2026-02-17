class LtiRegistrationSerializer < ActiveModel::Serializer
  attributes :id, :name, :issuer, :client_id, :deployment_id, :auth_login_url,
             :auth_token_url, :jwks_url, :description, :status, :settings_summary,
             :tenant_id, :created_by_id, :created_at, :updated_at

  def settings_summary
    return {} if object.settings.blank?

    safe_keys = %w[deployment_id deep_linking_enabled custom_params]
    secret_keys = object.settings.keys - safe_keys

    result = object.settings.slice(*safe_keys)
    secret_keys.each { |k| result[k] = "****" }
    result
  end
end
