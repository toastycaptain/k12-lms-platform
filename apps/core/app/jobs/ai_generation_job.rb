class AiGenerationJob < ApplicationJob
  queue_as :default

  def perform(invocation_id)
    invocation = AiInvocation.find(invocation_id)
    return if invocation.status == "completed"

    Current.tenant = invocation.tenant

    invocation.update!(status: "running", started_at: Time.current)

    provider_config = invocation.ai_provider_config
    start_time = Process.clock_gettime(Process::CLOCK_MONOTONIC)

    result = AiGatewayClient.generate(
      provider: provider_config.provider_name,
      model: invocation.model,
      messages: invocation.context["messages"],
      task_type: invocation.task_type,
      max_tokens: invocation.context["max_tokens"] || 4096,
      temperature: invocation.context["temperature"] || 0.7
    )

    duration = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - start_time) * 1000).round
    tokens = result["usage"] || {}

    invocation.complete!(
      tokens: tokens,
      duration: duration,
      response_hash: result
    )

    NotificationService.notify(
      user: invocation.user,
      type: "ai_generation_complete",
      title: "AI generation complete: #{invocation.task_type.humanize}",
      message: "Your AI-generated content is ready to review.",
      url: invocation.context["return_url"],
      notifiable: invocation
    )
  rescue AiGatewayClient::AiGatewayError => e
    invocation&.fail!(e.message)
  rescue StandardError => e
    invocation&.fail!(e.message)
    raise
  ensure
    Current.tenant = nil
  end
end
