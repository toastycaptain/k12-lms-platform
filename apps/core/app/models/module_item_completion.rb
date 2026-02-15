class ModuleItemCompletion < ApplicationRecord
  include TenantScoped

  belongs_to :user
  belongs_to :module_item

  validates :completed_at, presence: true
  validates :module_item_id, uniqueness: { scope: :user_id }
end
