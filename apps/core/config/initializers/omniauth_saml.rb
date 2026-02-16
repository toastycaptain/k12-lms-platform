# SAML configuration is loaded dynamically per tenant.
# This initializer sets up the SAML strategy with a request-based setup proc
# so each tenant can have its own IdP settings.

Rails.application.config.middleware.use OmniAuth::Builder do
  provider :saml,
    setup: lambda { |env|
      request = Rack::Request.new(env)
      tenant_slug = request.params["tenant"].presence || request.host.split(".").first
      tenant = Tenant.unscoped.find_by(slug: tenant_slug)
      next unless tenant

      saml_config = IntegrationConfig.unscoped.find_by(
        tenant: tenant,
        provider: "saml",
        status: "active"
      )
      next unless saml_config

      settings = saml_config.settings || {}
      env["omniauth.strategy"].options.merge!(
        issuer: settings["issuer"].presence || "k12-lms-#{tenant.slug}",
        idp_sso_service_url: settings["idp_sso_url"],
        idp_slo_service_url: settings["idp_slo_url"],
        idp_cert: settings["idp_cert"],
        idp_cert_fingerprint: settings["idp_cert_fingerprint"],
        name_identifier_format: settings["name_id_format"].presence || "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
        assertion_consumer_service_url: "#{request.base_url}/auth/saml/callback?tenant=#{tenant.slug}",
        attribute_statements: {
          email: [ settings["email_attr"].presence || "email", "urn:oid:0.9.2342.19200300.100.1.3" ],
          first_name: [ settings["first_name_attr"].presence || "first_name", "urn:oid:2.5.4.42" ],
          last_name: [ settings["last_name_attr"].presence || "last_name", "urn:oid:2.5.4.4" ]
        }
      )
    },
    issuer: "k12-lms",
    idp_sso_service_url: "https://example-idp.invalid/sso",
    idp_cert_fingerprint: "00"
end
