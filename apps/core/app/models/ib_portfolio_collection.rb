require "securerandom"

class IbPortfolioCollection < ApplicationRecord
  include TenantScoped

  VISIBILITY_TYPES = %w[private advisor_only guardian_shared school_shared].freeze

  belongs_to :school, optional: true
  belongs_to :student, class_name: "User"
  belongs_to :created_by, class_name: "User", optional: true

  before_validation :ensure_shared_token, if: -> { visibility != "private" && shared_token.blank? }

  validates :title, presence: true
  validates :visibility, inclusion: { in: VISIBILITY_TYPES }
  validates :shared_token, uniqueness: true, allow_nil: true

  private

  def ensure_shared_token
    self.shared_token = SecureRandom.hex(12)
  end
end
