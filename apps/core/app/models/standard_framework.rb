class StandardFramework < ApplicationRecord
  include TenantScoped

  FRAMEWORK_KINDS = %w[standard skill concept objective competency strand criterion custom].freeze
  STATUSES = %w[active archived draft deprecated].freeze

  has_many :standards, dependent: :destroy

  validates :name, presence: true
  validates :framework_kind, presence: true, inclusion: { in: FRAMEWORK_KINDS }
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :key, uniqueness: { scope: :tenant_id }, allow_nil: true

  before_validation :normalize_fields!

  after_commit :bust_framework_cache

  private

  def normalize_fields!
    self.key = key.to_s.strip.presence
    self.framework_kind = framework_kind.to_s.strip.presence || "standard"
    self.status = status.to_s.strip.presence || "active"
  end

  def bust_framework_cache
    tenant_ids = [ tenant_id, tenant_id_before_last_save ].compact.uniq

    tenant_ids.each do |tid|
      Rails.cache.delete("tenant:#{tid}:standard_frameworks")
      Rails.cache.delete("tenant:#{tid}:standard_frameworks:all:all")
      Rails.cache.delete("tenant:#{tid}:standard_frameworks:#{framework_kind || 'all'}:#{status || 'all'}")
      Rails.cache.delete("tenant:#{tid}:standards:all")
      Rails.cache.delete("tenant:#{tid}:standards:#{id}")
      begin
        Rails.cache.delete_matched("tenant:#{tid}:standard_frameworks:*")
      rescue StandardError
        nil
      end
    end
  end
end
