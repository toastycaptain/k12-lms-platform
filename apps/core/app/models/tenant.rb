class Tenant < ApplicationRecord
  belongs_to :district, optional: true

  has_many :schools, dependent: :destroy
  has_many :users, dependent: :destroy
  has_many :roles, dependent: :destroy
  has_many :academic_years, dependent: :destroy
  has_many :courses, dependent: :destroy
  has_many :unit_plans, dependent: :destroy
  has_many :goals, dependent: :destroy
  has_many :section_meetings, dependent: :destroy
  has_many :mobile_sessions, dependent: :destroy

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: true, format: { with: /\A[a-z0-9-]+\z/ }
end
