class CourseModule < ApplicationRecord
  include TenantScoped

  VALID_STATUSES = %w[draft published archived].freeze

  belongs_to :course
  has_many :module_items, dependent: :destroy

  validates :title, presence: true
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }

  scope :ordered, -> { order(:position) }

  def publish!
    raise ActiveRecord::RecordInvalid, self unless status == "draft"
    update!(status: "published")
  end

  def archive!
    raise ActiveRecord::RecordInvalid, self unless status == "published"
    update!(status: "archived")
  end
end
