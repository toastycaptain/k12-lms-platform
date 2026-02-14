class Announcement < ApplicationRecord
  include TenantScoped

  belongs_to :course
  belongs_to :created_by, class_name: "User"

  validates :title, presence: true
  validates :message, presence: true

  scope :published, -> { where.not(published_at: nil).where(published_at: ..Time.current) }
  scope :pinned_first, -> { order(pinned: :desc, published_at: :desc) }
end
