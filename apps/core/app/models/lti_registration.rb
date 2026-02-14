class LtiRegistration < ApplicationRecord
  include TenantScoped

  VALID_STATUSES = %w[active inactive].freeze

  belongs_to :created_by, class_name: "User"
  has_many :lti_resource_links, dependent: :destroy

  validates :name, presence: true
  validates :issuer, presence: true
  validates :client_id, presence: true
  validates :auth_login_url, presence: true
  validates :auth_token_url, presence: true
  validates :jwks_url, presence: true
  validates :deployment_id, presence: true
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }

  def activate!
    update!(status: "active")
  end

  def deactivate!
    update!(status: "inactive")
  end
end
