# Codex Instructions — LTI 1.3 Protocol Implementation

## Objective

Implement the LTI 1.3 launch protocol per PRD-15 (Phase 7) and Tech Spec. Currently the platform has LTI registration CRUD and an admin UI, but no actual LTI protocol flow. Without the protocol implementation, external tools cannot launch into the platform and the platform cannot embed external tools. This task adds OIDC-based launch, JWT validation, deep linking, and a tool launch page.

---

## What Already Exists (DO NOT recreate)

### Backend
- `LtiRegistration` model — name, issuer, client_id, deployment_id, auth_login_url, auth_token_url, jwks_url, settings (jsonb), status
- `LtiResourceLink` model — title, description, url, custom_params (jsonb), belongs_to lti_registration and course (optional)
- `LtiRegistrationsController` — full CRUD + activate/deactivate
- Routes: `resources :lti_registrations` with nested `lti_resource_links`, activate/deactivate member actions

### Frontend
- `apps/web/src/app/admin/lti/page.tsx` — admin page for managing LTI registrations and resource links

---

## Task 1: Add JWT/JWKS Dependencies

**Modify:** `apps/core/Gemfile`

Add:
```ruby
gem "jwt", "~> 2.9"
gem "json-jwt", "~> 1.16"  # For JWKS parsing
```

Run `bundle install`.

---

## Task 2: Platform Key Pair

The platform needs its own RSA key pair to sign JWTs and expose a JWKS endpoint.

**Create:** `apps/core/config/initializers/lti_keys.rb`

```ruby
# Load or generate the platform's RSA key pair for LTI 1.3
Rails.application.config.lti_private_key = if ENV["LTI_PRIVATE_KEY"].present?
  OpenSSL::PKey::RSA.new(ENV["LTI_PRIVATE_KEY"])
elsif Rails.env.test? || Rails.env.development?
  # Auto-generate for dev/test
  key_path = Rails.root.join("tmp", "lti_key.pem")
  if File.exist?(key_path)
    OpenSSL::PKey::RSA.new(File.read(key_path))
  else
    key = OpenSSL::PKey::RSA.generate(2048)
    FileUtils.mkdir_p(File.dirname(key_path))
    File.write(key_path, key.to_pem)
    key
  end
else
  raise "LTI_PRIVATE_KEY environment variable is required in production"
end
```

**Update:** `apps/core/.env.example` — add:
```env
# LTI 1.3 (optional — auto-generated in development)
LTI_PRIVATE_KEY=
```

---

## Task 3: OIDC Login Initiation & Launch Controller

**Create:** `apps/core/app/controllers/lti/launches_controller.rb`

```ruby
module Lti
  class LaunchesController < ActionController::API
    # Step 1: OIDC Login Initiation
    # The external tool redirects here to start the launch flow
    # GET/POST /lti/oidc_login
    def oidc_login
      registration = LtiRegistration.unscoped.find_by!(
        issuer: params[:iss],
        client_id: params[:client_id],
        status: "active"
      )

      state = SecureRandom.hex(32)
      nonce = SecureRandom.hex(16)

      # Store state and nonce in session for validation
      Rails.cache.write("lti_state:#{state}", {
        nonce: nonce,
        registration_id: registration.id
      }, expires_in: 10.minutes)

      redirect_to build_auth_redirect(registration, state, nonce), allow_other_host: true
    end

    # Step 2: Handle the ID Token callback
    # The IdP redirects back here with the signed JWT
    # POST /lti/launch
    def launch
      state = params[:state]
      id_token = params[:id_token]

      cached = Rails.cache.read("lti_state:#{state}")
      return render json: { error: "Invalid or expired state" }, status: :bad_request unless cached

      Rails.cache.delete("lti_state:#{state}")

      registration = LtiRegistration.unscoped.find(cached[:registration_id])
      claims = validate_jwt(id_token, registration, cached[:nonce])

      return render json: { error: "Invalid token" }, status: :unauthorized unless claims

      # Set tenant context
      tenant = registration.tenant
      Current.tenant = tenant

      # Find or create user from LTI claims
      user = resolve_user(claims, tenant)
      return render json: { error: "User could not be resolved" }, status: :unprocessable_entity unless user

      # Create session
      session[:user_id] = user.id
      session[:tenant_id] = tenant.id

      # Determine redirect based on message type
      message_type = claims["https://purl.imsglobal.org/spec/lti/claim/message_type"]

      case message_type
      when "LtiResourceLinkRequest"
        handle_resource_link_launch(claims, registration)
      when "LtiDeepLinkingRequest"
        handle_deep_linking_request(claims, registration)
      else
        redirect_to "#{frontend_url}/dashboard"
      end
    end

    # Step 3: Platform JWKS endpoint
    # External tools fetch this to verify platform-signed JWTs
    # GET /lti/jwks
    def jwks
      key = Rails.application.config.lti_private_key.public_key
      jwk = JWT::JWK.new(key, kid: "k12-lms-platform-key")
      render json: { keys: [jwk.export] }
    end

    private

    def build_auth_redirect(registration, state, nonce)
      params = {
        scope: "openid",
        response_type: "id_token",
        client_id: registration.client_id,
        redirect_uri: "#{request.base_url}/lti/launch",
        login_hint: params[:login_hint],
        lti_message_hint: params[:lti_message_hint],
        state: state,
        nonce: nonce,
        response_mode: "form_post"
      }
      "#{registration.auth_login_url}?#{params.to_query}"
    end

    def validate_jwt(token, registration, expected_nonce)
      # Fetch JWKS from the tool/IdP
      jwks_response = Faraday.get(registration.jwks_url)
      jwks = JSON::JWK::Set.new(JSON.parse(jwks_response.body))

      # Decode and verify
      decoded = JSON::JWT.decode(token, jwks)

      # Validate claims
      return nil unless decoded["iss"] == registration.issuer
      return nil unless decoded["aud"] == registration.client_id || Array(decoded["aud"]).include?(registration.client_id)
      return nil unless decoded["nonce"] == expected_nonce
      return nil unless decoded["exp"].to_i > Time.current.to_i

      decoded
    rescue StandardError => e
      Rails.logger.error("LTI JWT validation failed: #{e.message}")
      nil
    end

    def resolve_user(claims, tenant)
      email = claims["email"] || claims.dig("https://purl.imsglobal.org/spec/lti/claim/ext", "email")
      return nil if email.blank?

      User.find_by(email: email.downcase, tenant: tenant)
    end

    def handle_resource_link_launch(claims, registration)
      resource_link_id = claims.dig("https://purl.imsglobal.org/spec/lti/claim/resource_link", "id")

      link = registration.lti_resource_links.find_by(
        "custom_params->>'resource_link_id' = ?", resource_link_id
      )

      if link&.course
        redirect_to "#{frontend_url}/teach/courses/#{link.course_id}"
      else
        redirect_to "#{frontend_url}/dashboard"
      end
    end

    def handle_deep_linking_request(claims, registration)
      # Store deep linking return URL for the frontend to use
      return_url = claims.dig("https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings", "deep_link_return_url")

      redirect_to "#{frontend_url}/lti/deep-link?registration_id=#{registration.id}&return_url=#{CGI.escape(return_url || '')}"
    end

    def frontend_url
      ENV["CORS_ORIGINS"] || "http://localhost:3000"
    end
  end
end
```

---

## Task 4: LTI Routes

**Modify:** `apps/core/config/routes.rb`

Add LTI protocol routes OUTSIDE the api/v1 namespace (LTI uses its own URL patterns):

```ruby
# LTI 1.3 Protocol Endpoints
namespace :lti do
  match "oidc_login", to: "launches#oidc_login", via: [:get, :post]
  post "launch", to: "launches#launch"
  get "jwks", to: "launches#jwks"
end
```

---

## Task 5: Deep Linking Response

When the platform acts as a tool provider, it needs to send deep linking responses back to the launching platform.

**Create:** `apps/core/app/controllers/lti/deep_links_controller.rb`

```ruby
module Lti
  class DeepLinksController < ApplicationController
    # POST /api/v1/lti/deep_link_response
    # The frontend calls this to build a signed JWT containing the selected resources
    def create
      registration = LtiRegistration.find(params[:registration_id])
      authorize registration, :show?

      items = params[:items].map do |item|
        {
          type: "ltiResourceLink",
          title: item[:title],
          url: item[:url],
          custom: item[:custom_params] || {}
        }
      end

      jwt = build_deep_linking_jwt(registration, items)

      render json: { jwt: jwt, return_url: params[:return_url] }
    end

    private

    def build_deep_linking_jwt(registration, items)
      private_key = Rails.application.config.lti_private_key

      payload = {
        iss: registration.client_id,
        aud: registration.issuer,
        iat: Time.current.to_i,
        exp: 5.minutes.from_now.to_i,
        nonce: SecureRandom.hex(16),
        "https://purl.imsglobal.org/spec/lti/claim/message_type" => "LtiDeepLinkingResponse",
        "https://purl.imsglobal.org/spec/lti/claim/version" => "1.3.0",
        "https://purl.imsglobal.org/spec/lti-dl/claim/content_items" => items,
        "https://purl.imsglobal.org/spec/lti-dl/claim/data" => params[:data]
      }

      JWT.encode(payload, private_key, "RS256", kid: "k12-lms-platform-key")
    end
  end
end
```

**Add route:**
```ruby
namespace :api do
  namespace :v1 do
    namespace :lti do
      post "deep_link_response", to: "deep_links#create"
    end
    # ... existing routes ...
  end
end
```

---

## Task 6: Tool Launch Page

When an LTI resource link is embedded in a course module, students/teachers click it to launch the external tool.

**Create:** `apps/web/src/app/lti/launch/[linkId]/page.tsx`

**Requirements:**
1. Use `"use client"`, `ProtectedRoute`, `AppShell`, `apiFetch`
2. Fetch the resource link: `GET /api/v1/lti_resource_links/:linkId`
3. Display: tool name, description, "Launching..." message
4. On mount, open the tool URL in an iframe or redirect:
   - If the resource link has a `url`, embed it in a full-width iframe within the AppShell
   - Show a loading state while the iframe loads
5. "Open in New Tab" button as alternative to iframe
6. "Back to Course" link

---

## Task 7: Deep Linking Selection Page

When an external platform sends a deep linking request, the user picks content to link back.

**Create:** `apps/web/src/app/lti/deep-link/page.tsx`

**Requirements:**
1. Use `"use client"`, `ProtectedRoute`, `AppShell`, `apiFetch`
2. Read `registration_id` and `return_url` from URL params
3. **Content Picker**: tabbed interface to select content:
   - Courses tab: list courses, select one
   - Assignments tab: list assignments (filter by course), select one or more
   - Quizzes tab: list quizzes, select one or more
4. Selected items shown as tags with remove button
5. "Send" button:
   - POST to `/api/v1/lti/deep_link_response` with selected items, registration_id, return_url
   - Receive signed JWT
   - Auto-submit the JWT back to the return_url via a hidden form POST
6. "Cancel" link

---

## Task 8: Update Admin LTI Page

**Modify:** `apps/web/src/app/admin/lti/page.tsx`

**Requirements:**
1. Show platform endpoints section at the top:
   - OIDC Login URL: `{base_url}/lti/oidc_login`
   - Launch URL: `{base_url}/lti/launch`
   - JWKS URL: `{base_url}/lti/jwks`
   - "Copy" buttons for each URL
2. These are the URLs admins provide to external tool vendors for configuration
3. Keep all existing registration CRUD functionality

---

## Task 9: Specs

**Create:**
- `apps/core/spec/controllers/lti/launches_controller_spec.rb`
  - Test `GET /lti/oidc_login` with valid issuer/client_id redirects to auth_login_url with correct params
  - Test `GET /lti/oidc_login` with unknown registration returns 404
  - Test `POST /lti/launch` with valid JWT creates session and redirects
  - Test `POST /lti/launch` with invalid state returns 400
  - Test `POST /lti/launch` with expired/invalid JWT returns 401
  - Test `GET /lti/jwks` returns valid JWKS JSON

- `apps/core/spec/controllers/lti/deep_links_controller_spec.rb`
  - Test `POST /api/v1/lti/deep_link_response` returns signed JWT
  - Test JWT contains correct content_items

---

## Architecture Rules

1. LTI protocol endpoints (`/lti/*`) are NOT under `/api/v1` — they follow LTI spec conventions
2. Deep linking API endpoint IS under `/api/v1` — it's called by our own frontend
3. The platform JWKS endpoint is unauthenticated — external tools need to fetch it
4. OIDC login initiation accepts both GET and POST (per LTI spec)
5. JWT validation uses JWKS fetched from the tool's `jwks_url` stored in `LtiRegistration`
6. State/nonce are stored in Rails cache (Redis-backed in production) with 10-minute TTL
7. User resolution is by email — LTI claims must include an email
8. The platform key is RSA 2048-bit, auto-generated in dev/test, ENV-provided in production
9. Deep linking responses are signed with the platform's private key

---

## Testing

```bash
cd apps/core && bundle install && bundle exec rspec spec/controllers/lti/
cd apps/web && npm run lint && npm run typecheck && npm run build
```

---

## Definition of Done

- [ ] `jwt` and `json-jwt` gems added
- [ ] Platform RSA key pair initializer with dev auto-generation
- [ ] OIDC login initiation endpoint at `/lti/oidc_login`
- [ ] Launch callback endpoint at `/lti/launch` with JWT validation
- [ ] Platform JWKS endpoint at `/lti/jwks`
- [ ] Deep linking response endpoint at `/api/v1/lti/deep_link_response`
- [ ] Tool launch page with iframe embedding
- [ ] Deep linking content picker page
- [ ] Admin LTI page updated with platform endpoint URLs
- [ ] Controller specs for launch flow and deep linking
- [ ] All lint and build checks pass
