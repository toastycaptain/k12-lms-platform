class LtiRegistrationSerializer < ActiveModel::Serializer
  attributes :id, :name, :issuer, :client_id, :deployment_id, :auth_login_url,
             :auth_token_url, :jwks_url, :description, :status, :settings,
             :tenant_id, :created_by_id, :created_at, :updated_at
end
