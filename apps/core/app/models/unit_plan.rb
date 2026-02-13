class UnitPlan < ApplicationRecord
  include TenantScoped

  VALID_STATUSES = %w[draft published archived].freeze

  belongs_to :course
  belongs_to :created_by, class_name: "User"
  belongs_to :current_version, class_name: "UnitVersion", optional: true
  has_many :unit_versions, dependent: :destroy
  has_many :lesson_plans, dependent: :destroy

  validates :title, presence: true
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }

  def create_version!(attrs = {})
    next_number = (unit_versions.maximum(:version_number) || 0) + 1
    version = unit_versions.create!(
      tenant: tenant,
      version_number: next_number,
      title: attrs[:title] || title,
      description: attrs[:description],
      essential_questions: attrs[:essential_questions] || [],
      enduring_understandings: attrs[:enduring_understandings] || []
    )
    update!(current_version: version)
    version
  end

  def publish!
    raise ActiveRecord::RecordInvalid, self unless status == "draft"
    raise ActiveRecord::RecordInvalid, self unless current_version.present?

    update!(status: "published")
  end

  def archive!
    raise ActiveRecord::RecordInvalid, self unless status == "published"

    update!(status: "archived")
  end
end
