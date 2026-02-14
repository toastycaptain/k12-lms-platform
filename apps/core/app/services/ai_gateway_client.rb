class AiGatewayClient
  def initialize(base_url: nil)
    @base_url = base_url || ENV.fetch("AI_GATEWAY_URL", "http://localhost:8000")
    @conn = Faraday.new(url: @base_url) do |f|
      f.request :json
      f.response :json
      f.options.timeout = 120
      f.options.open_timeout = 10
    end
  end

  def generate(provider:, model:, prompt:, system_prompt: nil, temperature: 0.7,
               max_tokens: 2048, task_type: nil, tenant_id: nil, user_id: nil)
    response = @conn.post("/v1/generate") do |req|
      req.headers["X-Tenant-ID"] = tenant_id.to_s if tenant_id
      req.headers["X-User-ID"] = user_id.to_s if user_id
      req.body = {
        provider: provider,
        model: model,
        prompt: prompt,
        system_prompt: system_prompt,
        temperature: temperature,
        max_tokens: max_tokens,
        task_type: task_type
      }.compact
    end

    raise_on_error!(response)
    response.body
  end

  def generate_stream(provider:, model:, prompt:, system_prompt: nil, temperature: 0.7,
                      max_tokens: 2048, task_type: nil, tenant_id: nil, user_id: nil, &block)
    stream_conn = Faraday.new(url: @base_url) do |f|
      f.request :json
      f.options.timeout = 180
      f.options.open_timeout = 10
    end

    accumulated = ""
    final_usage = nil

    response = stream_conn.post("/v1/generate_stream") do |req|
      req.headers["X-Tenant-ID"] = tenant_id.to_s if tenant_id
      req.headers["X-User-ID"] = user_id.to_s if user_id
      req.headers["Accept"] = "text/event-stream"
      req.body = {
        provider: provider,
        model: model,
        prompt: prompt,
        system_prompt: system_prompt,
        temperature: temperature,
        max_tokens: max_tokens,
        task_type: task_type
      }.compact.to_json
    end

    raise_on_error!(response)

    response.body.each_line do |line|
      next unless line.start_with?("data: ")
      data = JSON.parse(line.sub("data: ", ""))
      accumulated += data["content"].to_s
      final_usage = data["usage"] if data["done"]
      block&.call(data)
    end

    { content: accumulated, usage: final_usage }
  end

  def health
    response = @conn.get("/v1/health")
    raise_on_error!(response)
    response.body
  end

  def providers
    response = @conn.get("/v1/providers")
    raise_on_error!(response)
    response.body
  end

  private

  def raise_on_error!(response)
    return if response.success?
    body = response.body
    message = body.is_a?(Hash) ? body["error"] || body.to_s : body.to_s
    raise AiGatewayError.new(message, status_code: response.status, response_body: body)
  end
end
