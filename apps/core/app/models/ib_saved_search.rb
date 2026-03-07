require "securerandom"

class IbSavedSearch < ApplicationRecord
  include TenantScoped

  belongs_to :school, optional: true
  belongs_to :user

  validates :name, :lens_key, :scope_key, presence: true

  before_validation :normalize_payloads
  before_validation :ensure_share_token

  scope :recent_first, -> { order(updated_at: :desc, id: :desc) }

  private

  def normalize_payloads
    self.filters = {} unless filters.is_a?(Hash)
    self.metadata = {} unless metadata.is_a?(Hash)
  end

  def ensure_share_token
    self.share_token = SecureRandom.hex(10) if share_token.blank?
  end
end
