class AiGatewayClient
  BASE_URL = ENV.fetch("AI_GATEWAY_URL", "http://localhost:8000")
  SERVICE_TOKEN = ENV.fetch("AI_GATEWAY_TOKEN", ENV.fetch("AI_GATEWAY_SERVICE_TOKEN", ""))

  class AiGatewayError < StandardError
    attr_reader :status_code, :response_body

    def initialize(message, status_code: nil, response_body: nil)
      @status_code = status_code
      @response_body = response_body
      super(message)
    end
  end

  def self.generate(provider:, model:, messages:, task_type: nil, max_tokens: 4096, temperature: 0.7, context: nil)
    prompt_payload = build_prompt_payload(messages)
    conn = Faraday.new(url: BASE_URL) do |f|
      f.request :json
      f.response :json
      f.options.timeout = 120
    end

    response = conn.post("/v1/generate") do |req|
      req.headers["Authorization"] = "Bearer #{SERVICE_TOKEN}"
      req.body = {
        provider: provider,
        model: model,
        prompt: prompt_payload[:prompt],
        system_prompt: prompt_payload[:system_prompt],
        task_type: task_type,
        max_tokens: max_tokens,
        temperature: temperature,
        context: normalize_context(context)
      }.compact
    end

    unless response.success?
      raise AiGatewayError.new(
        "AI Gateway error: #{response.status}",
        status_code: response.status,
        response_body: response.body
      )
    end

    response.body
  end

  # Streams tokens from the AI Gateway. Yields each chunk as it arrives.
  # Returns the full accumulated response text.
  def self.generate_stream(provider:, model:, messages:, task_type: nil, max_tokens: 4096, temperature: 0.7, context: nil, &block)
    prompt_payload = build_prompt_payload(messages)
    conn = Faraday.new(url: BASE_URL) do |f|
      f.request :json
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

    full_text = +""
    buffer = +""

    response = conn.post("/v1/generate_stream") do |req|
      req.headers["Authorization"] = "Bearer #{SERVICE_TOKEN}"
      req.headers["Content-Type"] = "application/json"
      req.headers["Accept"] = "text/event-stream"
      req.options.timeout = 300
      req.body = payload.to_json

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
    return nil if context.blank?
    return context.to_h if context.respond_to?(:to_h)

    nil
  end
  private_class_method :normalize_context

  private_class_method :parse_stream_line
end
