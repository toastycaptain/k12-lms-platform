class Rubric < ApplicationRecord
  include TenantScoped

  belongs_to :created_by, class_name: "User"
  has_many :rubric_criteria, dependent: :destroy
  has_many :assignments

  validates :title, presence: true
end
