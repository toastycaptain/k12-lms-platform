class BackupRecord < ApplicationRecord
  VALID_STATUSES = %w[in_progress completed failed verified verification_failed].freeze
  VALID_TYPES = %w[full incremental].freeze

  validates :backup_type, presence: true, inclusion: { in: VALID_TYPES }
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }
  validates :s3_key, presence: true
  validates :s3_bucket, presence: true

  scope :recent, -> { order(created_at: :desc).limit(30) }
  scope :successful, -> { where(status: %w[completed verified]) }
  scope :latest_verified, -> { where(status: "verified").order(created_at: :desc).first }

  def mark_completed!(size:, duration:, metadata: {})
    update!(
      status: "completed",
      size_bytes: size,
      duration_seconds: duration,
      metadata: metadata
    )
  end

  def mark_failed!(error:)
    update!(
      status: "failed",
      error_message: error
    )
  end

  def mark_verified!(result:)
    update!(
      status: "verified",
      verified_at: Time.current,
      verification_result: result
    )
  end

  def mark_verification_failed!(result:, error: nil)
    update!(
      status: "verification_failed",
      verified_at: Time.current,
      verification_result: result,
      error_message: error
    )
  end

  def size_mb
    return nil unless size_bytes

    (size_bytes / 1_048_576.0).round(2)
  end
end
