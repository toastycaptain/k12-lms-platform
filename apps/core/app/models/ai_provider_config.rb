class AiProviderConfig < ApplicationRecord
  include TenantScoped

  VALID_PROVIDER_NAMES = %w[openai anthropic].freeze
  VALID_STATUSES = %w[inactive active error].freeze

  encrypts :api_key

  belongs_to :created_by, class_name: "User"
  has_many :ai_task_policies, dependent: :destroy

  validates :provider_name, presence: true, inclusion: { in: VALID_PROVIDER_NAMES }
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }
  validates :display_name, presence: true
  validates :default_model, presence: true
  validates :provider_name, uniqueness: { scope: :tenant_id }

  def activate!
    raise ActiveRecord::RecordInvalid, self unless api_key.present?
    update!(status: "active")
  end

  def deactivate!
    update!(status: "inactive")
  end
end
