class Section < ApplicationRecord
  include TenantScoped

  belongs_to :course
  belongs_to :term
  has_many :enrollments, dependent: :destroy
  has_many :users, through: :enrollments

  validates :name, presence: true
end
