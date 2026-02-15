class AiProviderConfig < ApplicationRecord
  include TenantScoped

  VALID_STATUSES = %w[active inactive].freeze
  VALID_PROVIDERS = %w[anthropic openai].freeze

  belongs_to :created_by, class_name: "User"
  has_many :ai_task_policies, dependent: :restrict_with_error
  has_many :ai_invocations, dependent: :restrict_with_error

  validates :provider_name, presence: true, inclusion: { in: VALID_PROVIDERS }
  validates :provider_name, uniqueness: { scope: :tenant_id }
  validates :display_name, presence: true
  validates :default_model, presence: true
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }

  encrypts :api_key

  def activate!
    update!(status: "active")
  end

  def deactivate!
    update!(status: "inactive")
  end
end
