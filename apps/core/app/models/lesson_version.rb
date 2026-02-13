class LessonVersion < ApplicationRecord
  include TenantScoped

  belongs_to :lesson_plan

  validates :version_number, presence: true, uniqueness: { scope: :lesson_plan_id }
  validates :title, presence: true
end
