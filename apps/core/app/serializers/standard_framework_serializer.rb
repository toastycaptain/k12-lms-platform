class StandardFrameworkSerializer < ActiveModel::Serializer
  attributes :id, :name, :jurisdiction, :subject, :version, :created_at, :updated_at
end
