class Discussion < ApplicationRecord
  include TenantScoped

  VALID_STATUSES = %w[open locked archived].freeze

  belongs_to :course
  belongs_to :created_by, class_name: "User"
  has_many :discussion_posts, dependent: :destroy

  validates :title, presence: true
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }
end
