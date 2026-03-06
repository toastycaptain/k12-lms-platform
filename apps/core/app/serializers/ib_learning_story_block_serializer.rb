class IbLearningStoryBlockSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :ib_learning_story_id, :position, :block_type, :content, :metadata, :created_at, :updated_at
end
