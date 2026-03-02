class Section < ApplicationRecord
  include TenantScoped

  belongs_to :course
  belongs_to :term
  has_many :enrollments, dependent: :destroy
  has_many :users, through: :enrollments
  has_many :section_meetings, dependent: :destroy
  has_many :attendances, dependent: :destroy

  validates :name, presence: true
end
