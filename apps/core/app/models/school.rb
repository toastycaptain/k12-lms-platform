class School < ApplicationRecord
  include TenantScoped

  validates :name, presence: true
  validates :timezone, presence: true
end
