class Assignment < ApplicationRecord
  include TenantScoped

  VALID_STATUSES = %w[draft published closed archived].freeze
  VALID_TYPES = %w[written file_upload url discussion].freeze

  belongs_to :course, counter_cache: true
  belongs_to :created_by, class_name: "User"
  belongs_to :rubric, optional: true
  belongs_to :grade_category, optional: true
  has_many :submissions, dependent: :destroy
  has_many :assignment_standards, dependent: :destroy
  has_many :standards, through: :assignment_standards
  has_many :resource_links, as: :linkable, dependent: :destroy

  validates :title, presence: true
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }
  validates :assignment_type, presence: true, inclusion: { in: VALID_TYPES }
  validates :points_possible, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  def publish!
    raise ActiveRecord::RecordInvalid, self unless status == "draft"
    update!(status: "published")
  end

  def close!
    raise ActiveRecord::RecordInvalid, self unless status == "published"
    update!(status: "closed")
  end

  def archive!
    update!(status: "archived")
  end
end
