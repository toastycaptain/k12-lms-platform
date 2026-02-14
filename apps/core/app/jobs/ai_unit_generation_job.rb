class AiUnitGenerationJob < ApplicationJob
  queue_as :default

  def perform(invocation_id, params)
    invocation = AiInvocation.unscoped.find(invocation_id)
    Current.tenant = invocation.tenant
    invocation.start!

    begin
      task_policy = invocation.ai_task_policy
      template = invocation.ai_template

      if template
        prompt = template.render(
          subject: params["subject"],
          topic: params["topic"],
          grade_level: params["grade_level"]
        )
        system_prompt = template.system_prompt
      else
        prompt = build_unit_prompt(params)
        system_prompt = nil
      end

      client = AiGatewayClient.new
      result = client.generate(
        provider: invocation.provider_name,
        model: invocation.model,
        prompt: prompt,
        system_prompt: system_prompt,
        temperature: [ task_policy&.temperature_limit || 0.7, 0.7 ].min,
        max_tokens: [ task_policy&.max_tokens_limit || 4096, 4096 ].min,
        task_type: "unit_generation",
        tenant_id: Current.tenant.id,
        user_id: invocation.user_id
      )

      content = parse_json_content(result["content"])
      Rails.cache.write("ai_result_#{invocation.id}", content, expires_in: 1.hour)

      invocation.complete!(
        prompt_tokens: result.dig("usage", "prompt_tokens"),
        completion_tokens: result.dig("usage", "completion_tokens"),
        total_tokens: result.dig("usage", "total_tokens")
      )
    rescue => e
      invocation.fail!(e.message)
      raise
    end
  end

  private

  def build_unit_prompt(params)
    parts = [ "Generate a comprehensive unit plan for #{params['subject']} on the topic '#{params['topic']}' for grade #{params['grade_level']}." ]
    parts << "Include #{params['num_lessons']} lessons." if params["num_lessons"]
    parts << "Align to standards: #{params['standards'].join(', ')}." if params["standards"].present?
    parts << "Additional context: #{params['additional_context']}" if params["additional_context"].present?
    parts.join("\n")
  end

  def parse_json_content(content)
    JSON.parse(content)
  rescue JSON::ParserError
    { "raw_content" => content }
  end
end
