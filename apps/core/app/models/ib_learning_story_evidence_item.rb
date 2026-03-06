class IbLearningStoryEvidenceItem < ApplicationRecord
  include TenantScoped

  belongs_to :ib_learning_story
  belongs_to :ib_evidence_item

  validates :ib_evidence_item_id, uniqueness: { scope: :ib_learning_story_id }
end
