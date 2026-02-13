class TemplateVersionStandard < ApplicationRecord
  include TenantScoped

  belongs_to :template_version
  belongs_to :standard

  validates :standard_id, uniqueness: { scope: :template_version_id }
end
