class Term < ApplicationRecord
  include TenantScoped
  include DateRangeValidatable

  belongs_to :academic_year

  validates :name, presence: true
  validates :start_date, presence: true
  validates :end_date, presence: true
end
