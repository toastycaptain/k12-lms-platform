class Course < ApplicationRecord
  include TenantScoped

  belongs_to :academic_year
  has_many :sections, dependent: :destroy

  validates :name, presence: true
end
