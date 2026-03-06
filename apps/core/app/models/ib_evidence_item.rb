class IbEvidenceItem < ApplicationRecord
  include TenantScoped
  include AttachmentValidatable

  STATUS_TYPES = %w[needs_validation validated reflection_requested linked_to_story held_internal published].freeze
  VISIBILITY_TYPES = %w[undecided internal student_visible guardian_visible family_ready].freeze

  belongs_to :school
  belongs_to :planning_context, optional: true
  belongs_to :curriculum_document, optional: true
  belongs_to :curriculum_document_version, optional: true
  belongs_to :student, class_name: "User", optional: true
  belongs_to :created_by, class_name: "User"

  has_many :reflection_requests, class_name: "IbReflectionRequest", dependent: :destroy
  has_many :story_links, class_name: "IbLearningStoryEvidenceItem", dependent: :destroy
  has_many :learning_stories, through: :story_links, source: :ib_learning_story

  has_many_attached :attachments
  validates_attachment :attachments,
    content_types: %w[image/png image/jpeg image/webp application/pdf video/mp4 audio/mpeg],
    max_size: 250.megabytes,
    count: { max: 8 }

  validates :title, presence: true
  validates :programme, presence: true
  validates :status, inclusion: { in: STATUS_TYPES }
  validates :visibility, inclusion: { in: VISIBILITY_TYPES }

  def warnings
    Array(metadata["warnings"])
  end
end
