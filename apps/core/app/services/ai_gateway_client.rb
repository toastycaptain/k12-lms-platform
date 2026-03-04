require "digest"
require "openssl"
require "securerandom"
require "uri"

class AiGatewayClient
  BASE_URL = ENV.fetch("AI_GATEWAY_URL", "http://localhost:8000")
  SERVICE_TOKEN = ENV.fetch("AI_GATEWAY_TOKEN", ENV.fetch("AI_GATEWAY_SERVICE_TOKEN", ""))
  REQUEST_TIMEOUT_SECONDS = 120
  STREAM_TIMEOUT_SECONDS = 300

  class AiGatewayError < StandardError
    attr_reader :status_code, :response_body

    def initialize(message, status_code: nil, response_body: nil)
      @status_code = status_code
      @response_body = response_body
      super(message)
    end
  end

  def self.generate(provider:, model:, messages:, task_type: nil, max_tokens: 4096, temperature: 0.7, context: nil)
    ensure_secure_configuration!
    prompt_payload = build_prompt_payload(messages)
    payload = {
      provider: provider,
      model: model,
      prompt: prompt_payload[:prompt],
      system_prompt: prompt_payload[:system_prompt],
      task_type: task_type,
      max_tokens: max_tokens,
      temperature: temperature,
      context: normalize_context(context)
    }.compact
    payload_json = payload.to_json
    conn = Faraday.new(url: BASE_URL) do |f|
      f.response :json
      f.options.timeout = REQUEST_TIMEOUT_SECONDS
      f.options.open_timeout = 15
    end

    response = conn.post("/v1/generate") do |req|
      req.headers["Content-Type"] = "application/json"
      req.headers["Accept"] = "application/json"
      apply_service_auth_headers!(
        request: req,
        method: "POST",
        path: "/v1/generate",
        payload_json: payload_json
      )
      req.body = payload_json
    end

    unless response.success?
      raise AiGatewayError.new(
        "AI Gateway error: #{response.status}",
        status_code: response.status,
        response_body: response.body
      )
    end

    response.body
  rescue Faraday::Error => e
    raise AiGatewayError.new("AI Gateway request failed: #{e.message}", status_code: 502, response_body: e.message)
  end

  # Streams tokens from the AI Gateway. Yields each chunk as it arrives.
  # Returns the full accumulated response text.
  def self.generate_stream(provider:, model:, messages:, task_type: nil, max_tokens: 4096, temperature: 0.7, context: nil, &block)
    ensure_secure_configuration!
    prompt_payload = build_prompt_payload(messages)
    conn = Faraday.new(url: BASE_URL) do |f|
      f.adapter :net_http
    end

    payload = {
      provider: provider,
      model: model,
      prompt: prompt_payload[:prompt],
      system_prompt: prompt_payload[:system_prompt],
      task_type: task_type,
      max_tokens: max_tokens,
      temperature: temperature,
      context: normalize_context(context)
    }.compact
    payload_json = payload.to_json

    full_text = +""
    buffer = +""

    response = conn.post("/v1/generate_stream") do |req|
      req.headers["Content-Type"] = "application/json"
      req.headers["Accept"] = "text/event-stream"
      apply_service_auth_headers!(
        request: req,
        method: "POST",
        path: "/v1/generate_stream",
        payload_json: payload_json
      )
      req.options.timeout = STREAM_TIMEOUT_SECONDS
      req.options.open_timeout = 15
      req.body = payload_json

      req.options.on_data = proc do |chunk, _size, _env|
        buffer << chunk
        lines = buffer.split("\n")
        buffer = lines.pop.to_s

        lines.each do |line|
          parse_stream_line(line, full_text: full_text, on_token: block)
        end
      end
    end

    parse_stream_line(buffer, full_text: full_text, on_token: block) if buffer.present?

    unless response.success?
      raise AiGatewayError.new(
        "AI Gateway stream error: #{response.status}",
        status_code: response.status,
        response_body: response.body
      )
    end

    full_text
  rescue Faraday::Error => e
    raise AiGatewayError.new("Stream request failed: #{e.message}", status_code: 502, response_body: e.message)
  end

  def self.parse_stream_line(line, full_text:, on_token:)
    normalized_line = line.to_s.strip
    return if normalized_line.blank?
    return unless normalized_line.start_with?("data: ")

    data = normalized_line.sub("data: ", "")
    return if data == "[DONE]"

    parsed = JSON.parse(data)
    token = extract_stream_token(parsed)
    full_text << token if token.present?
    on_token&.call(token.presence, parsed)
  rescue JSON::ParserError
    nil
  end

  def self.extract_stream_token(parsed)
    return "" unless parsed.is_a?(Hash)

    if parsed["done"]
      (parsed["delta"] || parsed["text"] || parsed["token"]).to_s
    else
      (parsed["content"] || parsed["delta"] || parsed["text"] || parsed["token"]).to_s
    end
  end
  private_class_method :extract_stream_token

  def self.build_prompt_payload(messages)
    normalized_messages = normalize_messages(messages)
    user_prompt = normalized_messages
      .select { |message| message[:role] == "user" }
      .map { |message| message[:content] }
      .join("\n\n")
      .strip
    fallback_prompt = normalized_messages
      .reject { |message| message[:role] == "system" }
      .map { |message| message[:content] }
      .join("\n\n")
      .strip

    prompt = user_prompt.presence || fallback_prompt.presence
    if prompt.blank?
      raise AiGatewayError.new("AI prompt is required", status_code: 422)
    end

    system_prompt = normalized_messages
      .reverse
      .find { |message| message[:role] == "system" }
      &.dig(:content)

    {
      prompt: prompt,
      system_prompt: system_prompt
    }
  end
  private_class_method :build_prompt_payload

  def self.normalize_messages(messages)
    Array(messages).filter_map do |message|
      raw = if message.respond_to?(:to_h)
        message.to_h
      else
        next
      end

      role = raw[:role] || raw["role"]
      content = raw[:content] || raw["content"]
      next if role.blank? || content.blank?

      {
        role: role.to_s,
        content: content.to_s
      }
    end
  end
  private_class_method :normalize_messages

  def self.normalize_context(context)
    base_context = if context.respond_to?(:to_h)
      context.to_h
    else
      {}
    end

    tenant = defined?(Current) ? Current.tenant : nil
    tenant_settings = tenant&.settings || {}
    base_context["tenant_id"] ||= tenant&.id
    base_context["safety_level"] ||= tenant_settings.dig("ai_safety_level") || "strict"
    base_context.presence
  end
  private_class_method :normalize_context

  def self.ensure_secure_configuration!
    uri = URI.parse(BASE_URL)
    raise AiGatewayError.new("AI_GATEWAY_URL must include a hostname") if uri.host.blank?
    if Rails.env.production? && uri.scheme != "https"
      raise AiGatewayError.new("AI_GATEWAY_URL must use https in production")
    end
    if Rails.env.production? && SERVICE_TOKEN.blank?
      raise AiGatewayError.new("AI_GATEWAY_TOKEN is required in production")
    end
  rescue URI::InvalidURIError => e
    raise AiGatewayError.new("AI_GATEWAY_URL is invalid: #{e.message}")
  end
  private_class_method :ensure_secure_configuration!

  def self.apply_service_auth_headers!(request:, method:, path:, payload_json:)
    token = SERVICE_TOKEN.to_s
    if token.blank?
      return unless Rails.env.production?

      raise AiGatewayError.new("AI_GATEWAY_TOKEN is required in production")
    end

    timestamp = Time.current.to_i
    nonce = SecureRandom.hex(16)
    body_digest = Digest::SHA256.hexdigest(payload_json.to_s)
    canonical = [ method.to_s.upcase, path.to_s, timestamp, nonce, body_digest ].join("\n")
    signature = OpenSSL::HMAC.hexdigest("SHA256", token, canonical)

    request.headers["X-Service-Auth-Version"] = "v1"
    request.headers["X-Service-Timestamp"] = timestamp.to_s
    request.headers["X-Service-Nonce"] = nonce
    request.headers["X-Service-Signature"] = signature
    request.headers["X-Tenant-ID"] = Current.tenant.id.to_s if defined?(Current) && Current.tenant&.id

    # Allow gradual migration in non-production environments only.
    request.headers["Authorization"] = "Bearer #{token}" unless Rails.env.production?
  end
  private_class_method :apply_service_auth_headers!

  private_class_method :parse_stream_line
end
