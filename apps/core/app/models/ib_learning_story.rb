class IbLearningStory < ApplicationRecord
  include TenantScoped

  STATE_TYPES = %w[draft needs_context ready_for_digest scheduled published held].freeze

  belongs_to :school
  belongs_to :planning_context, optional: true
  belongs_to :curriculum_document, optional: true
  belongs_to :created_by, class_name: "User"

  has_many :blocks, class_name: "IbLearningStoryBlock", dependent: :destroy
  has_many :evidence_links, class_name: "IbLearningStoryEvidenceItem", dependent: :destroy
  has_many :evidence_items, through: :evidence_links, source: :ib_evidence_item
  has_many :publishing_queue_items, class_name: "IbPublishingQueueItem", dependent: :destroy

  validates :title, presence: true
  validates :state, inclusion: { in: STATE_TYPES }
  validates :cadence, presence: true
  validates :audience, presence: true

  def latest_queue_item
    publishing_queue_items.order(updated_at: :desc).first
  end
end
