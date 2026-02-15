class AiProviderConfig < ApplicationRecord
  include TenantScoped

  belongs_to :created_by, class_name: "User"

  has_many :ai_task_policies, dependent: :destroy
  has_many :ai_invocations, dependent: :nullify

  validates :provider_name, presence: true
  validates :display_name, presence: true
  validates :default_model, presence: true
  validates :status, presence: true
end
