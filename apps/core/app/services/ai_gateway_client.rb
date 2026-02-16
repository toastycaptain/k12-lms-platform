class AiGatewayClient
  BASE_URL = ENV.fetch("AI_GATEWAY_URL", "http://localhost:8000")
  SERVICE_TOKEN = ENV.fetch("AI_GATEWAY_SERVICE_TOKEN", "")

  class AiGatewayError < StandardError
    attr_reader :status_code, :response_body

    def initialize(message, status_code: nil, response_body: nil)
      @status_code = status_code
      @response_body = response_body
      super(message)
    end
  end

  def self.generate(provider:, model:, messages:, task_type: nil, max_tokens: 4096, temperature: 0.7)
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
        messages: messages,
        task_type: task_type,
        max_tokens: max_tokens,
        temperature: temperature
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
  def self.generate_stream(provider:, model:, messages:, task_type: nil, max_tokens: 4096, temperature: 0.7, &block)
    conn = Faraday.new(url: BASE_URL) do |f|
      f.request :json
      f.adapter :net_http
    end

    payload = {
      provider: provider,
      model: model,
      messages: messages,
      task_type: task_type,
      max_tokens: max_tokens,
      temperature: temperature
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
    token = parsed["content"] || parsed["delta"] || parsed["text"] || ""
    return if token.empty?

    full_text << token
    on_token&.call(token, parsed)
  rescue JSON::ParserError
    nil
  end

  private_class_method :parse_stream_line
end
