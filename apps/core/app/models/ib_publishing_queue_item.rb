class IbPublishingQueueItem < ApplicationRecord
  include TenantScoped

  STATE_TYPES = %w[draft ready_for_digest scheduled published held].freeze

  belongs_to :school
  belongs_to :ib_learning_story
  belongs_to :created_by, class_name: "User"

  has_many :audits, class_name: "IbPublishingAudit", dependent: :destroy

  validates :state, inclusion: { in: STATE_TYPES }
end
