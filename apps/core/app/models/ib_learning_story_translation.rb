class IbLearningStoryTranslation < ApplicationRecord
  include TenantScoped

  STATE_TYPES = %w[draft translated reviewed published].freeze

  belongs_to :ib_learning_story
  belongs_to :translated_by, class_name: "User", optional: true

  validates :locale, presence: true, uniqueness: { scope: :ib_learning_story_id }
  validates :state, inclusion: { in: STATE_TYPES }
end
