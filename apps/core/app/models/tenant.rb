class Tenant < ApplicationRecord
  has_many :schools, dependent: :destroy
  has_many :users, dependent: :destroy
  has_many :roles, dependent: :destroy

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: true, format: { with: /\A[a-z0-9-]+\z/ }
end
