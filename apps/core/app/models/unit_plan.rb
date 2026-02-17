class UnitPlan < ApplicationRecord
  include TenantScoped
  include AttachmentValidatable

  VALID_STATUSES = %w[draft pending_approval published archived].freeze

  belongs_to :course
  belongs_to :created_by, class_name: "User"
  belongs_to :current_version, class_name: "UnitVersion", optional: true
  has_many :unit_versions, dependent: :destroy
  has_many :lesson_plans, dependent: :destroy
  has_many :approvals, as: :approvable, dependent: :destroy
  has_one_attached :exported_pdf
  validates_attachment :exported_pdf,
    content_types: %w[application/pdf],
    max_size: 100.megabytes

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

  def submit_for_approval!(user:)
    raise ActiveRecord::RecordInvalid, self unless status == "draft"
    raise ActiveRecord::RecordInvalid, self unless current_version.present?

    update!(status: "pending_approval")
    approvals.create!(
      tenant: tenant,
      requested_by: user,
      status: "pending"
    )
  end

  def publish!
    raise ActiveRecord::RecordInvalid, self unless %w[draft pending_approval].include?(status)
    raise ActiveRecord::RecordInvalid, self unless current_version.present?

    update!(status: "published")
  end

  def archive!
    raise ActiveRecord::RecordInvalid, self unless status == "published"

    update!(status: "archived")
  end
end
