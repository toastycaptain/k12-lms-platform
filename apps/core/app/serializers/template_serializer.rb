class TemplateSerializer < ActiveModel::Serializer
  attributes :id, :name, :subject, :grade_level, :description, :status,
             :created_by_id, :current_version_id, :created_at, :updated_at
end
