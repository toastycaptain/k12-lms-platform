class AiTemplateSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :task_type, :name, :system_prompt,
    :user_prompt_template, :variables, :status, :created_by_id,
    :created_at, :updated_at
end
