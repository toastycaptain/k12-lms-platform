module DateRangeValidatable
  extend ActiveSupport::Concern

  included do
    validate :end_date_after_start_date
  end

  private

  def end_date_after_start_date
    return unless start_date && end_date
    errors.add(:end_date, "must be after start date") if end_date <= start_date
  end
end
