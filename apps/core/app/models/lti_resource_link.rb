class LtiResourceLink < ApplicationRecord
  include TenantScoped

  belongs_to :lti_registration
  belongs_to :course, optional: true

  validates :title, presence: true
end
