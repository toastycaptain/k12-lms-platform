class SectionMeeting < ApplicationRecord
  include TenantScoped

  belongs_to :section

  validates :weekday, presence: true, inclusion: { in: 0..6 }
  validates :start_time, :end_time, presence: true
  validate :end_after_start
  validate :section_in_tenant

  scope :for_weekday, ->(weekday) { where(weekday: weekday.to_i) }

  private

  def end_after_start
    return if start_time.blank? || end_time.blank?
    return if end_time > start_time

    errors.add(:end_time, "must be after start time")
  end

  def section_in_tenant
    return if section_id.blank?
    return if section&.tenant_id == tenant_id

    errors.add(:section_id, "must belong to the same tenant")
  end
end
