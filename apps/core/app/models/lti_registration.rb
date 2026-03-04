class LtiRegistration < ApplicationRecord
  include TenantScoped

  VALID_STATUSES = %w[active inactive].freeze

  belongs_to :created_by, class_name: "User"
  has_many :lti_resource_links, dependent: :destroy

  validates :name, presence: true
  validates :issuer, presence: true
  validates :client_id, presence: true
  validates :deployment_id, presence: true
  validates :auth_login_url, presence: true
  validates :auth_token_url, presence: true
  validates :jwks_url, presence: true
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }
  validate :validate_endpoint_urls_safety

  def activate!
    update!(status: "active")
  end

  def deactivate!
    update!(status: "inactive")
  end

  private

  def validate_endpoint_urls_safety
    allowed_hosts = ENV["LTI_ALLOWED_HOSTS"].to_s.split(",").map(&:strip).reject(&:blank?).presence
    allowed_ports = Rails.env.production? ? [ 443 ] : [ 80, 443 ]
    allowed_schemes = Rails.env.production? ? %w[https] : %w[http https]
    validator = SafeUrlValidator.new(
      attributes: [ :jwks_url ],
      allowed_domains: allowed_hosts,
      allowed_ports: allowed_ports,
      allowed_schemes: allowed_schemes
    )

    %i[jwks_url auth_login_url auth_token_url].each do |attribute|
      validator.validate_each(self, attribute, public_send(attribute))
    end
  end
end
