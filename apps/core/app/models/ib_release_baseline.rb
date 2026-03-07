class IbReleaseBaseline < ApplicationRecord
  include TenantScoped

  STATUS_TYPES = %w[draft verified certified failed rolled_back].freeze
  RELEASE_CHANNELS = %w[ib-pilot ib-ga-candidate ib-ga].freeze

  belongs_to :school, optional: true
  belongs_to :created_by, class_name: "User", optional: true
  belongs_to :certified_by, class_name: "User", optional: true

  validates :release_channel, inclusion: { in: RELEASE_CHANNELS }
  validates :status, inclusion: { in: STATUS_TYPES }
  validates :pack_key, :pack_version, presence: true

  before_validation :normalize_payloads

  scope :recent_first, -> { order(updated_at: :desc, id: :desc) }

  private

  def normalize_payloads
    self.checklist = {} unless checklist.is_a?(Hash)
    self.flag_snapshot = {} unless flag_snapshot.is_a?(Hash)
    self.dependency_snapshot = {} unless dependency_snapshot.is_a?(Hash)
    self.metadata = {} unless metadata.is_a?(Hash)
  end
end
