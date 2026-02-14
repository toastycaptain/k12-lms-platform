class QuestionBank < ApplicationRecord
  include TenantScoped

  VALID_STATUSES = %w[active archived].freeze

  belongs_to :created_by, class_name: "User"

  validates :title, presence: true
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }

  def archive!
    raise ActiveRecord::RecordInvalid, self unless status == "active"
    update!(status: "archived")
  end
end
