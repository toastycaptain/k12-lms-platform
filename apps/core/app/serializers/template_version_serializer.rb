class TemplateVersionSerializer < ActiveModel::Serializer
  attributes :id, :template_id, :version_number, :title, :description,
             :essential_questions, :enduring_understandings, :suggested_duration_weeks,
             :created_at, :updated_at
end
