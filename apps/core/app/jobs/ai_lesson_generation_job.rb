class AiLessonGenerationJob < ApplicationJob
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
        prompt = build_lesson_prompt(params)
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
        task_type: "lesson_generation",
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

  def build_lesson_prompt(params)
    parts = [ "Generate a detailed lesson plan for #{params['subject']} on the topic '#{params['topic']}' for grade #{params['grade_level']}." ]
    parts << "Objectives: #{params['objectives']}" if params["objectives"].present?
    parts << "Duration: #{params['duration_minutes']} minutes." if params["duration_minutes"].present?

    if params["unit_plan_id"].present?
      unit_plan = UnitPlan.unscoped.find_by(id: params["unit_plan_id"])
      if unit_plan
        parts << "This lesson is part of the unit: #{unit_plan.title}."
        if unit_plan.current_version
          version = unit_plan.current_version
          parts << "Essential questions: #{version.essential_questions.join(', ')}." if version.essential_questions.present?
        end
        existing_lessons = unit_plan.lesson_plans.pluck(:title)
        parts << "Existing lessons in unit: #{existing_lessons.join(', ')}." if existing_lessons.any?
      end
    end

    parts << "Align to standards: #{params['standards'].join(', ')}." if params["standards"].present?
    parts << "Additional context: #{params['additional_context']}" if params["additional_context"].present?
    parts << "Include title, objectives, activities, materials, and duration_minutes in the response."
    parts.join("\n")
  end

  def parse_json_content(content)
    JSON.parse(content)
  rescue JSON::ParserError
    { "raw_content" => content }
  end
end
