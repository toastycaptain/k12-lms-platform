class District < ApplicationRecord
  has_many :tenants, dependent: :nullify
  has_many :schools, through: :tenants

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: true, format: { with: /\A[a-z0-9-]+\z/ }
end
