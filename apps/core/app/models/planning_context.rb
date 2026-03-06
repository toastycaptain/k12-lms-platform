class PlanningContext < ApplicationRecord
  include TenantScoped

  belongs_to :school
  belongs_to :academic_year
  belongs_to :created_by, class_name: "User"

  has_many :planning_context_courses, dependent: :destroy
  has_many :courses, through: :planning_context_courses
  has_many :curriculum_documents, dependent: :destroy

  validates :kind, presence: true
  validates :name, presence: true
end
