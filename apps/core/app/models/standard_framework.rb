class StandardFramework < ApplicationRecord
  include TenantScoped

  has_many :standards, dependent: :destroy

  validates :name, presence: true
end
