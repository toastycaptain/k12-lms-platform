class CurriculumProfileRelease < ApplicationRecord
  include TenantScoped

  STATUSES = %w[draft published deprecated frozen rolled_back].freeze

  belongs_to :imported_by, class_name: "User", optional: true

  validates :profile_key, presence: true
  validates :profile_version, presence: true
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :profile_version, uniqueness: { scope: [ :tenant_id, :profile_key ] }

  scope :for_profile, ->(key) { where(profile_key: key) }
  scope :published, -> { where(status: "published") }
  scope :frozen_state, -> { where(status: "frozen") }
  scope :latest_first, -> { order(updated_at: :desc, id: :desc) }
end
