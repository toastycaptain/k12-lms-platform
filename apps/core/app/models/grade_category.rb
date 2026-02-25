class GradeCategory < ApplicationRecord
  include TenantScoped

  belongs_to :course
  has_many :assignments, dependent: :nullify

  validates :name, presence: true
  validates :weight_percentage,
    presence: true,
    numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
  validates :name, uniqueness: { scope: [ :tenant_id, :course_id ] }
end
