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
end
