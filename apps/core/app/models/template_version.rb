class TemplateVersion < ApplicationRecord
  include TenantScoped

  belongs_to :template

  validates :version_number, presence: true, uniqueness: { scope: :template_id }
  validates :title, presence: true
end
