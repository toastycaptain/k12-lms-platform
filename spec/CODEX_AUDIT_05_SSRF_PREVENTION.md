# CODEX_AUDIT_05 — SSRF Prevention & URL Validation

**Priority:** MEDIUM
**Effort:** 2–3 hours
**Depends On:** None
**Branch:** `audit/05-ssrf-prevention`

---

## Findings

The security audit found:

1. **OneRosterClient base_url is user-controlled** — `IntegrationConfig.settings["base_url"]` is set by admins via the API. `OneRosterClient` (line 15-16) uses this as the Faraday base URL. An admin could set it to `http://localhost:6379` (Redis), `http://169.254.169.254` (AWS metadata), or other internal services.
2. **LTI JWKS URL is user-controlled** — `LtiRegistration.jwks_url` is settable via the LTI registrations API. During JWT validation, the app makes a `Faraday.get(registration.jwks_url)` call (launches_controller.rb:102). An admin could set this to an internal URL.
3. **IntegrationConfig base_url stored without validation** — No model-level check prevents `http://127.0.0.1`, `http://[::1]`, or `http://metadata.google.internal`.

---

## Fixes

### 1. Create SafeUrlValidator

**File: `apps/core/app/validators/safe_url_validator.rb`**

```ruby
require "ipaddr"

class SafeUrlValidator < ActiveModel::EachValidator
  BLOCKED_HOSTS = %w[
    localhost
    127.0.0.1
    0.0.0.0
    ::1
    [::1]
    metadata.google.internal
    169.254.169.254
    metadata.internal
  ].freeze

  BLOCKED_RANGES = [
    IPAddr.new("10.0.0.0/8"),
    IPAddr.new("172.16.0.0/12"),
    IPAddr.new("192.168.0.0/16"),
    IPAddr.new("127.0.0.0/8"),
    IPAddr.new("169.254.0.0/16"),  # Link-local / cloud metadata
    IPAddr.new("0.0.0.0/8"),
    IPAddr.new("::1/128"),
    IPAddr.new("fc00::/7"),        # IPv6 unique local
    IPAddr.new("fe80::/10"),       # IPv6 link-local
  ].freeze

  def validate_each(record, attribute, value)
    return if value.blank?

    begin
      uri = URI.parse(value.to_s.strip)
    rescue URI::InvalidURIError
      record.errors.add(attribute, "is not a valid URL")
      return
    end

    # Must be HTTP or HTTPS
    unless %w[http https].include?(uri.scheme)
      record.errors.add(attribute, "must use http or https (got: #{uri.scheme})")
      return
    end

    # Must have a host
    if uri.host.blank?
      record.errors.add(attribute, "must include a hostname")
      return
    end

    host = uri.host.downcase.gsub(/[\[\]]/, "")  # Strip IPv6 brackets

    # Check against blocked hostnames
    if BLOCKED_HOSTS.include?(host)
      record.errors.add(attribute, "cannot point to internal addresses (#{host})")
      return
    end

    # Check against blocked IP ranges
    begin
      addr = IPAddr.new(host)
      if BLOCKED_RANGES.any? { |range| range.include?(addr) }
        record.errors.add(attribute, "cannot point to private or internal IP addresses")
        return
      end
    rescue IPAddr::InvalidAddressError
      # Not an IP address — it's a hostname, which is fine
      # But check for suspicious patterns
      if host.match?(/\A\d+\.\d+\.\d+\.\d+\z/)
        # Looks like an IP but failed to parse — suspicious
        record.errors.add(attribute, "contains an invalid IP address")
        return
      end
    end

    # Resolve hostname to check for DNS rebinding to internal IPs
    # Only do this if configured (expensive operation)
    if options[:resolve_dns]
      begin
        resolved = Resolv.getaddresses(host)
        resolved.each do |ip|
          addr = IPAddr.new(ip)
          if BLOCKED_RANGES.any? { |range| range.include?(addr) }
            record.errors.add(attribute, "resolves to a private IP address (#{ip})")
            return
          end
        end
      rescue Resolv::ResolvError
        # DNS resolution failed — allow it (external service may be temporarily down)
      end
    end
  end
end
```

### 2. Apply to IntegrationConfig Model

**File: `apps/core/app/models/integration_config.rb`**

Add URL validation for the base_url stored in settings:

```ruby
validate :validate_base_url_safety

private

def validate_base_url_safety
  url = settings&.dig("base_url")
  return if url.blank?

  validator = SafeUrlValidator.new(attributes: [:base_url])
  # Create a temporary struct to run the validator
  temp = Struct.new(:base_url, :errors) do
    def self.model_name
      ActiveModel::Name.new(self, nil, "IntegrationConfig")
    end
  end.new(url, errors)

  validator.validate_each(temp, :base_url, url)
end
```

Or more cleanly, add a virtual attribute:

```ruby
attr_accessor :_base_url_for_validation

before_validation :extract_base_url_for_validation

validates :_base_url_for_validation, safe_url: true, allow_blank: true

private

def extract_base_url_for_validation
  self._base_url_for_validation = settings&.dig("base_url")
end
```

### 3. Apply to LtiRegistration Model

**File: `apps/core/app/models/lti_registration.rb`**

Read the model. Find any URL fields (`jwks_url`, `auth_login_url`, `auth_token_url`, `key_set_url`). Add validation:

```ruby
validates :jwks_url, safe_url: true, allow_blank: true
validates :auth_login_url, safe_url: true, allow_blank: true
validates :auth_token_url, safe_url: true, allow_blank: true
validates :key_set_url, safe_url: true, allow_blank: true
```

### 4. Add URL Validation to OneRosterClient

**File: `apps/core/app/services/one_roster_client.rb`**

Add a runtime check at initialization. Find where the client is initialized with a base_url and add:

```ruby
def initialize(base_url:, client_id:, client_secret:, **options)
  validate_url_safety!(base_url)
  @base_url = base_url
  @client_id = client_id
  @client_secret = client_secret
  # ... rest of initialization
end

private

def validate_url_safety!(url)
  uri = URI.parse(url)

  blocked_hosts = %w[localhost 127.0.0.1 0.0.0.0 ::1 169.254.169.254 metadata.google.internal]
  if blocked_hosts.include?(uri.host&.downcase)
    raise ArgumentError, "OneRoster base_url cannot point to internal addresses: #{uri.host}"
  end

  begin
    addr = IPAddr.new(uri.host)
    if addr.private? || addr.loopback? || addr.link_local?
      raise ArgumentError, "OneRoster base_url cannot point to private IP: #{uri.host}"
    end
  rescue IPAddr::InvalidAddressError
    # Hostname, not IP — fine
  end
rescue URI::InvalidURIError
  raise ArgumentError, "OneRoster base_url is not a valid URL: #{url}"
end
```

### 5. Add URL Validation to LTI JWKS Fetch

**File: `apps/core/app/controllers/lti/launches_controller.rb`**

Find where `Faraday.get(registration.jwks_url)` is called (approximately line 102). Add a guard before the fetch:

```ruby
# Before fetching JWKS
validate_external_url!(registration.jwks_url)

# ... existing Faraday.get call ...
```

Add the helper method:

```ruby
private

def validate_external_url!(url)
  uri = URI.parse(url)
  blocked = %w[localhost 127.0.0.1 0.0.0.0 ::1 169.254.169.254 metadata.google.internal]
  if blocked.include?(uri.host&.downcase)
    raise SecurityError, "Cannot fetch from internal address: #{uri.host}"
  end

  begin
    addr = IPAddr.new(uri.host)
    if addr.private? || addr.loopback? || addr.link_local?
      raise SecurityError, "Cannot fetch from private IP: #{uri.host}"
    end
  rescue IPAddr::InvalidAddressError
    # Hostname — fine
  end
rescue URI::InvalidURIError
  raise SecurityError, "Invalid URL: #{url}"
end
```

Add a rescue in the JWKS fetch block:

```ruby
rescue SecurityError => e
  Rails.logger.error("[LTI] SSRF blocked: #{e.message}")
  render json: { error: "Invalid JWKS URL configuration" }, status: :bad_request
  return
```

### 6. Write Tests

**File: `apps/core/spec/validators/safe_url_validator_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe SafeUrlValidator do
  let(:validatable_class) do
    Class.new do
      include ActiveModel::Model
      include ActiveModel::Validations
      attr_accessor :url
      validates :url, safe_url: true

      def self.model_name
        ActiveModel::Name.new(self, nil, "TestModel")
      end
    end
  end

  subject(:model) { validatable_class.new(url: url) }

  describe "valid URLs" do
    %w[
      https://example.com/api
      https://oneroster.school.edu/ims
      http://external-service.com:8080/path
    ].each do |valid_url|
      context "with #{valid_url}" do
        let(:url) { valid_url }
        it { is_expected.to be_valid }
      end
    end
  end

  describe "blocked internal hosts" do
    %w[
      http://localhost:3000/api
      http://127.0.0.1/secret
      http://0.0.0.0:8080/admin
      http://[::1]/api
      http://169.254.169.254/latest/meta-data/
      http://metadata.google.internal/computeMetadata/v1/
    ].each do |blocked_url|
      context "with #{blocked_url}" do
        let(:url) { blocked_url }
        it { is_expected.not_to be_valid }
      end
    end
  end

  describe "blocked private IP ranges" do
    %w[
      http://10.0.0.1/internal
      http://172.16.0.1/internal
      http://192.168.1.1/internal
    ].each do |private_url|
      context "with #{private_url}" do
        let(:url) { private_url }
        it { is_expected.not_to be_valid }
      end
    end
  end

  describe "blocked schemes" do
    %w[
      ftp://example.com/file
      file:///etc/passwd
      gopher://example.com
    ].each do |bad_scheme|
      context "with #{bad_scheme}" do
        let(:url) { bad_scheme }
        it { is_expected.not_to be_valid }
      end
    end
  end

  describe "blank URL" do
    let(:url) { "" }
    it "allows blank when using allow_blank" do
      klass = Class.new do
        include ActiveModel::Model
        include ActiveModel::Validations
        attr_accessor :url
        validates :url, safe_url: true, allow_blank: true
        def self.model_name
          ActiveModel::Name.new(self, nil, "TestModel")
        end
      end
      expect(klass.new(url: "")).to be_valid
    end
  end
end
```

**File: `apps/core/spec/services/one_roster_client_ssrf_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe OneRosterClient do
  describe "SSRF prevention" do
    it "rejects localhost base_url" do
      expect {
        described_class.new(base_url: "http://localhost:6379", client_id: "id", client_secret: "secret")
      }.to raise_error(ArgumentError, /internal/)
    end

    it "rejects 169.254.169.254 (cloud metadata)" do
      expect {
        described_class.new(base_url: "http://169.254.169.254/latest", client_id: "id", client_secret: "secret")
      }.to raise_error(ArgumentError, /internal/)
    end

    it "rejects private IP ranges" do
      expect {
        described_class.new(base_url: "http://10.0.0.5/api", client_id: "id", client_secret: "secret")
      }.to raise_error(ArgumentError, /private/)
    end

    it "allows external URLs" do
      # This will fail to connect but should not raise ArgumentError
      expect {
        described_class.new(base_url: "https://oneroster.example.com/ims", client_id: "id", client_secret: "secret")
      }.not_to raise_error
    end
  end
end
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/app/validators/safe_url_validator.rb` | SSRF prevention validator |
| `apps/core/spec/validators/safe_url_validator_spec.rb` | Validator tests |
| `apps/core/spec/services/one_roster_client_ssrf_spec.rb` | OneRoster SSRF tests |

## Files to Modify

| File | Change |
|------|--------|
| `apps/core/app/models/integration_config.rb` | Add SafeUrlValidator on settings.base_url |
| `apps/core/app/models/lti_registration.rb` | Add SafeUrlValidator on jwks_url, auth_login_url, auth_token_url |
| `apps/core/app/services/one_roster_client.rb` | Add URL safety check in initializer |
| `apps/core/app/controllers/lti/launches_controller.rb` | Add SSRF guard before JWKS fetch |

## Definition of Done

- [ ] SafeUrlValidator blocks localhost, 127.0.0.1, ::1, 169.254.169.254, private IPs, non-HTTP schemes
- [ ] IntegrationConfig.settings["base_url"] validated at model level
- [ ] LtiRegistration URL fields (jwks_url, auth_login_url, auth_token_url) validated
- [ ] OneRosterClient rejects internal base_url at initialization
- [ ] LTI JWKS fetch guarded against SSRF
- [ ] All SSRF tests pass
- [ ] `bundle exec rspec` passes
- [ ] `bundle exec rubocop` passes
