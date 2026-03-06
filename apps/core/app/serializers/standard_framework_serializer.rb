class StandardFrameworkSerializer < ActiveModel::Serializer
  attributes :id, :name, :key, :framework_kind, :status, :metadata, :jurisdiction, :subject, :version, :created_at, :updated_at
end
