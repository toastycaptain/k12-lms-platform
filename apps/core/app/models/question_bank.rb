class QuestionBank < ApplicationRecord
  include TenantScoped
  include AttachmentValidatable

  VALID_STATUSES = %w[active archived].freeze

  belongs_to :created_by, class_name: "User"
  has_many :questions, dependent: :destroy
  has_one_attached :qti_export
  validates_attachment :qti_export,
    content_types: AttachmentValidatable::ALLOWED_EXPORT_TYPES,
    max_size: 100.megabytes

  validates :title, presence: true
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }

  def archive!
    raise ActiveRecord::RecordInvalid, self unless status == "active"
    update!(status: "archived")
  end
end
