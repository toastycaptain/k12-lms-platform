class TemplateVersion < ApplicationRecord
  include TenantScoped

  belongs_to :template
  has_many :template_version_standards, dependent: :destroy
  has_many :standards, through: :template_version_standards

  validates :version_number, presence: true, uniqueness: { scope: :template_id }
  validates :title, presence: true
end
