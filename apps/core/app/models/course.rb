class Course < ApplicationRecord
  include TenantScoped

  belongs_to :academic_year
  has_many :sections, dependent: :destroy
  has_many :enrollments, through: :sections
  has_many :course_modules, dependent: :destroy
  has_many :assignments, dependent: :destroy
  has_many :grade_categories, dependent: :destroy
  has_many :discussions, dependent: :destroy
  has_many :announcements, dependent: :destroy
  has_many :message_threads, dependent: :nullify
  has_many :quizzes, dependent: :destroy

  validates :name, presence: true
end
