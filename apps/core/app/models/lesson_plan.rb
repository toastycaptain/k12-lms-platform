class LessonPlan < ApplicationRecord
  include TenantScoped
  include AttachmentValidatable

  VALID_STATUSES = %w[draft published].freeze

  belongs_to :unit_plan
  belongs_to :created_by, class_name: "User"
  belongs_to :current_version, class_name: "LessonVersion", optional: true
  has_many :lesson_versions, dependent: :destroy
  has_one_attached :exported_pdf
  validates_attachment :exported_pdf,
    content_types: %w[application/pdf],
    max_size: 100.megabytes

  validates :title, presence: true
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }
  validates :position, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  def create_version!(attrs = {})
    next_number = (lesson_versions.maximum(:version_number) || 0) + 1
    version = lesson_versions.create!(
      tenant: tenant,
      version_number: next_number,
      title: attrs[:title] || title,
      objectives: attrs[:objectives],
      activities: attrs[:activities],
      materials: attrs[:materials],
      duration_minutes: attrs[:duration_minutes]
    )
    update!(current_version: version)
    version
  end
end
