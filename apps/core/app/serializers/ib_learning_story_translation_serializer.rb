class IbLearningStoryTranslationSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :ib_learning_story_id, :translated_by_id, :locale, :state,
    :translated_title, :translated_summary, :translated_support_prompt, :metadata, :created_at,
    :updated_at
end
