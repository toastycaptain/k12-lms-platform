class AiTemplateSerializer < ActiveModel::Serializer
  attributes :id, :name, :task_type, :status, :system_prompt, :user_prompt_template,
             :variables, :tenant_id, :created_by_id, :created_at, :updated_at
end
