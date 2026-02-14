class Quiz < ApplicationRecord
  include TenantScoped

  VALID_STATUSES = %w[draft published closed archived].freeze
  VALID_QUIZ_TYPES = %w[standard practice survey].freeze
  VALID_SHOW_RESULTS = %w[after_submit after_due_date never].freeze

  belongs_to :course
  belongs_to :created_by, class_name: "User"
  # has_many :quiz_items added in US-055
  # has_many :questions, through: :quiz_items added in US-055

  validates :title, presence: true
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }
  validates :quiz_type, presence: true, inclusion: { in: VALID_QUIZ_TYPES }
  validates :show_results, presence: true, inclusion: { in: VALID_SHOW_RESULTS }
  validates :attempts_allowed, numericality: { greater_than: 0 }
  validates :time_limit_minutes, numericality: { greater_than: 0 }, allow_nil: true
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

  def calculate_points!
    update!(points_possible: QuizItem.where(quiz_id: id).sum(:points))
  end
end
