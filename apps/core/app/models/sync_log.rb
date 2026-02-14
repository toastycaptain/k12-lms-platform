class SyncLog < ApplicationRecord
  include TenantScoped

  VALID_LEVELS = %w[info warn error].freeze

  belongs_to :sync_run

  validates :level, presence: true, inclusion: { in: VALID_LEVELS }
  validates :message, presence: true
end
