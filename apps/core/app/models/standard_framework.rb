class StandardFramework < ApplicationRecord
  include TenantScoped

  has_many :standards, dependent: :destroy

  validates :name, presence: true

  after_commit :bust_framework_cache

  private

  def bust_framework_cache
    tenant_ids = [ tenant_id, tenant_id_before_last_save ].compact.uniq

    tenant_ids.each do |tid|
      Rails.cache.delete("tenant:#{tid}:standard_frameworks")
      Rails.cache.delete("tenant:#{tid}:standards:all")
      Rails.cache.delete("tenant:#{tid}:standards:#{id}")
    end
  end
end
