class IbPublishingAudit < ApplicationRecord
  include TenantScoped

  belongs_to :school
  belongs_to :ib_learning_story, optional: true
  belongs_to :ib_publishing_queue_item, optional: true
  belongs_to :changed_by, class_name: "User", optional: true

  validates :event_type, presence: true
end
