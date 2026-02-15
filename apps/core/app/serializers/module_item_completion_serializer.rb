class ModuleItemCompletionSerializer < ActiveModel::Serializer
  attributes :id, :module_item_id, :user_id, :completed_at, :created_at, :updated_at
end
