class LessonVersion < ApplicationRecord
  include TenantScoped

  belongs_to :lesson_plan
  has_many :resource_links, as: :linkable, dependent: :destroy

  validates :version_number, presence: true, uniqueness: { scope: :lesson_plan_id }
  validates :title, presence: true
end
