class AcademicYear < ApplicationRecord
  include TenantScoped
  include DateRangeValidatable

  has_many :terms, dependent: :destroy

  validates :name, presence: true
  validates :start_date, presence: true
  validates :end_date, presence: true
end
