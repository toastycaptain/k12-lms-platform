class LtiRegistrationSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :name, :description, :issuer, :client_id,
    :auth_login_url, :auth_token_url, :jwks_url, :deployment_id,
    :status, :settings, :created_by_id, :created_at, :updated_at
end
