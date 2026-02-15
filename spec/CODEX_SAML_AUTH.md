# Codex Instructions — SAML Authentication

## Objective

Add SAML SSO authentication per Tech Spec §2.3. Many K-12 schools use SAML-based identity providers (AD FS, Okta, Azure AD, Clever) for single sign-on. Currently only Google OAuth is supported. This task adds SAML as an additional authentication method with admin-configurable IdP settings per tenant.

---

## What Already Exists (DO NOT recreate)

### Backend
- `OmniAuth` with Google OAuth2 (`omniauth-google-oauth2` gem)
- `SessionsController` with `omniauth_callback` action that handles Google auth
- `User` model with `email`, `first_name`, `last_name`, `google_access_token`, `google_refresh_token`
- `IntegrationConfig` model with `provider`, `settings` (jsonb), `status` — used for Google Classroom and OneRoster
- `Current.user` and `Current.tenant` set in ApplicationController
- Session-based authentication (cookie + CSRF)
- Routes: `get "/auth/:provider/callback", to: "sessions#omniauth_callback"`

### Frontend
- Login flow redirects to `/auth/google_oauth2`
- `auth-context.tsx` provides user object with roles
- `ProtectedRoute` component checks authentication

---

## Task 1: Add omniauth-saml Gem

**Modify:** `apps/core/Gemfile`

Add to the main group (not development/test):
```ruby
gem "omniauth-saml", "~> 2.2"
```

Run `bundle install` to update Gemfile.lock.

---

## Task 2: SAML OmniAuth Configuration

**Create:** `apps/core/config/initializers/omniauth_saml.rb`

```ruby
# SAML configuration is loaded dynamically per tenant.
# This initializer sets up the SAML strategy with a request-based setup proc
# so each tenant can have its own IdP settings.

Rails.application.config.middleware.use OmniAuth::Builder do
  provider :saml,
    setup: lambda { |env|
      request = Rack::Request.new(env)

      # Extract tenant from subdomain or slug parameter
      tenant_slug = request.params["tenant"] || request.host.split(".").first
      tenant = Tenant.find_by(slug: tenant_slug)

      if tenant
        saml_config = IntegrationConfig.unscoped.find_by(tenant: tenant, provider: "saml", status: "active")

        if saml_config
          settings = saml_config.settings
          env["omniauth.strategy"].options.merge!(
            issuer: settings["issuer"] || "k12-lms-#{tenant.slug}",
            idp_sso_service_url: settings["idp_sso_url"],
            idp_slo_service_url: settings["idp_slo_url"],
            idp_cert: settings["idp_cert"],
            idp_cert_fingerprint: settings["idp_cert_fingerprint"],
            name_identifier_format: settings["name_id_format"] || "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
            assertion_consumer_service_url: "#{request.base_url}/auth/saml/callback?tenant=#{tenant.slug}",
            attribute_statements: {
              email: [settings["email_attr"] || "email", "urn:oid:0.9.2342.19200300.100.1.3"],
              first_name: [settings["first_name_attr"] || "first_name", "urn:oid:2.5.4.42"],
              last_name: [settings["last_name_attr"] || "last_name", "urn:oid:2.5.4.4"]
            }
          )
        end
      end
    }
end
```

---

## Task 3: SAML Callback Handler

**Modify:** `apps/core/app/controllers/api/v1/sessions_controller.rb`

Add SAML handling to the existing `omniauth_callback` method. The callback should handle both Google and SAML providers.

After the existing Google OAuth handling, add SAML support:

```ruby
def omniauth_callback
  auth = request.env["omniauth.auth"]
  provider = auth&.provider

  case provider
  when "google_oauth2"
    # ... existing Google handling ...
  when "saml"
    handle_saml_callback(auth)
  else
    render json: { error: "Unsupported provider" }, status: :unprocessable_entity
  end
end

private

def handle_saml_callback(auth)
  tenant_slug = params[:tenant] || request.host.split(".").first
  tenant = Tenant.find_by(slug: tenant_slug)
  return render json: { error: "Tenant not found" }, status: :not_found unless tenant

  Current.tenant = tenant

  email = auth.info.email || auth.attributes&.dig(:email)&.first
  return render json: { error: "No email in SAML response" }, status: :unprocessable_entity if email.blank?

  user = User.find_by(email: email.downcase)

  if user.nil?
    # Auto-provision user from SAML attributes if configured
    saml_config = IntegrationConfig.find_by(provider: "saml", status: "active")
    if saml_config&.settings&.dig("auto_provision")
      user = User.create!(
        email: email.downcase,
        first_name: auth.info.first_name || auth.attributes&.dig(:first_name)&.first || "User",
        last_name: auth.info.last_name || auth.attributes&.dig(:last_name)&.first || "",
        tenant: tenant
      )
      default_role = saml_config.settings["default_role"] || "student"
      user.add_role(default_role)
    else
      return render json: { error: "User not found and auto-provisioning is disabled" }, status: :not_found
    end
  end

  session[:user_id] = user.id
  session[:tenant_id] = tenant.id

  redirect_to "#{ENV['CORS_ORIGINS'] || 'http://localhost:3000'}/dashboard"
end
```

---

## Task 4: SAML Metadata Endpoint

**Create:** `apps/core/app/controllers/api/v1/saml_controller.rb`

```ruby
class Api::V1::SamlController < ActionController::API
  # GET /api/v1/saml/metadata?tenant=slug
  # Returns SP metadata XML for IdP configuration
  def metadata
    tenant_slug = params[:tenant]
    return render plain: "Tenant required", status: :bad_request if tenant_slug.blank?

    tenant = Tenant.find_by(slug: tenant_slug)
    return render plain: "Tenant not found", status: :not_found unless tenant

    settings = OneLogin::RubySaml::Settings.new
    settings.issuer = "k12-lms-#{tenant.slug}"
    settings.assertion_consumer_service_url = "#{request.base_url}/auth/saml/callback?tenant=#{tenant.slug}"
    settings.name_identifier_format = "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"

    meta = OneLogin::RubySaml::Metadata.new
    render xml: meta.generate(settings), content_type: "application/xml"
  end
end
```

**Add route** (unauthenticated, outside the main auth block):
```ruby
namespace :api do
  namespace :v1 do
    get "saml/metadata", to: "saml#metadata"
    # ... existing routes ...
  end
end
```

---

## Task 5: Admin SAML Configuration Page

**Create:** `apps/web/src/app/admin/integrations/saml/page.tsx`

**Requirements:**
1. Use `"use client"`, `ProtectedRoute`, `AppShell`, `apiFetch`
2. Restricted to admin role
3. **Current Status**: show whether SAML is active or inactive for this tenant
4. **Configuration Form**:
   - IdP SSO URL (required)
   - IdP SLO URL (optional)
   - IdP Certificate (textarea, PEM format) OR Certificate Fingerprint
   - Name ID Format (dropdown: emailAddress, persistent, transient — default emailAddress)
   - Attribute Mapping section:
     - Email attribute name (default: "email")
     - First name attribute name (default: "first_name")
     - Last name attribute name (default: "last_name")
   - Auto-provision users toggle (boolean)
   - Default role for auto-provisioned users (dropdown: student, teacher, admin)
5. **Save** button → creates or updates `IntegrationConfig` with provider "saml" via `POST /api/v1/integration_configs` or `PATCH /api/v1/integration_configs/:id`
6. **Activate / Deactivate** toggle → calls `POST /api/v1/integration_configs/:id/activate` or `deactivate`
7. **SP Metadata** section:
   - Show the SP metadata URL: `/api/v1/saml/metadata?tenant={slug}`
   - "Copy URL" button
   - "Download Metadata XML" button that fetches and downloads
   - Instructions: "Provide this URL to your identity provider to configure the service provider connection"
8. **Test Connection** button — links to `/auth/saml?tenant={slug}` in a new window (initiates SAML flow)
9. On load, fetch existing SAML config: `GET /api/v1/integration_configs` filtered by provider "saml"

---

## Task 6: Update Login Page for SAML

**Modify:** `apps/web/src/app/login/page.tsx` (or wherever the login UI lives)

**Requirements:**
1. Keep existing "Sign in with Google" button
2. Add "Sign in with SSO" button below it
3. Clicking "Sign in with SSO" shows a tenant slug input field: "Enter your school code"
4. On submit, redirect to `/auth/saml?tenant={slug}`
5. If only one auth method is configured (check via an unauthenticated endpoint or static config), show only that button
6. Style consistently with the Google button

---

## Task 7: Specs

**Create:**
- `apps/core/spec/requests/api/v1/saml_spec.rb`
  - Test `GET /api/v1/saml/metadata?tenant=slug` returns XML with correct issuer and ACS URL
  - Test missing tenant returns 400
  - Test invalid tenant returns 404

- `apps/core/spec/requests/api/v1/sessions_saml_spec.rb`
  - Test SAML callback with valid auth hash creates session
  - Test SAML callback with auto-provision creates user
  - Test SAML callback without auto-provision and unknown user returns 404
  - Test SAML callback with missing email returns 422

---

## Architecture Rules

1. SAML configuration is per-tenant — stored in `IntegrationConfig` with provider "saml"
2. The OmniAuth SAML strategy uses a dynamic setup proc to load tenant-specific settings at request time
3. SAML metadata endpoint is unauthenticated (IdPs need to fetch it)
4. User auto-provisioning is opt-in per tenant (controlled by `auto_provision` setting)
5. SAML does NOT replace Google OAuth — both can be active simultaneously
6. Sensitive fields (IdP certificate) are stored in IntegrationConfig.settings jsonb — consider encrypting with Active Record encryption if the column supports it
7. The SAML callback must set `Current.tenant` before looking up users (tenant-scoped query)

---

## Testing

```bash
cd apps/core && bundle install && bundle exec rspec spec/requests/api/v1/saml* spec/requests/api/v1/sessions_saml*
cd apps/web && npm run lint && npm run typecheck && npm run build
```

---

## Definition of Done

- [ ] `omniauth-saml` gem added and configured with dynamic per-tenant setup
- [ ] SAML callback handler in sessions controller with auto-provisioning support
- [ ] SP metadata endpoint at `/api/v1/saml/metadata`
- [ ] Admin SAML configuration page with IdP settings, attribute mapping, activate/deactivate
- [ ] Login page updated with "Sign in with SSO" option
- [ ] Request specs for metadata and callback
- [ ] All lint and build checks pass
