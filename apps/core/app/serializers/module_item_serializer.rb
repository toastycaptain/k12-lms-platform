class ModuleItemSerializer < ActiveModel::Serializer
  attributes :id, :course_module_id, :title, :item_type, :itemable_type, :itemable_id, :position, :created_at, :updated_at
end
