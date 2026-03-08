class IbOperationalJobEvent < ApplicationRecord
  include TenantScoped

  EVENT_TYPES = %w[
    queued
    started
    succeeded
    failed
    retried
    replayed
    cancelled
    dead_lettered
    recovered
    backfill_requested
  ].freeze

  belongs_to :school, optional: true
  belongs_to :ib_operational_job
  belongs_to :actor, class_name: "User", optional: true

  validates :event_type, inclusion: { in: EVENT_TYPES }
  validates :event_type, :occurred_at, presence: true

  before_validation :normalize_payload

  private

  def normalize_payload
    self.payload = {} unless payload.is_a?(Hash)
  end
end
