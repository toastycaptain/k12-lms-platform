class Course < ApplicationRecord
  include TenantScoped

  belongs_to :academic_year
  has_many :sections, dependent: :destroy
  has_many :course_modules, dependent: :destroy

  validates :name, presence: true
end
