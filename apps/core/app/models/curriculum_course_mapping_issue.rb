class CurriculumCourseMappingIssue < ApplicationRecord
  include TenantScoped

  STATUSES = %w[unresolved resolved ignored].freeze

  belongs_to :course
  belongs_to :resolved_school, class_name: "School", optional: true
  belongs_to :resolved_by, class_name: "User", optional: true

  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :reason, presence: true
  validates :course_id, uniqueness: { scope: :tenant_id }

  scope :unresolved, -> { where(status: "unresolved").order(created_at: :asc) }
  scope :latest_first, -> { order(updated_at: :desc, id: :desc) }

  def resolve!(school:, actor:, metadata: {})
    update!(
      status: "resolved",
      resolved_school: school,
      resolved_by: actor,
      resolved_at: Time.current,
      metadata: (self.metadata || {}).merge(metadata)
    )
  end
end
