class DeployWindowService
  SCHOOL_HOURS_START = 8
  SCHOOL_HOURS_END = 15

  class << self
    def allowed_now?(time = Time.current)
      !school_hours?(time)
    end

    def current_status(time = Time.current)
      if allowed_now?(time)
        {
          allowed: true,
          message: "Deployment window open",
          next_blocked_window: next_school_window(time)
        }
      else
        next_window = next_safe_window(time)
        {
          allowed: false,
          message: "Deployments blocked during school hours",
          next_safe_window: next_window,
          wait_minutes: ((next_window - time) / 60).round
        }
      end
    end

    def next_safe_window(time = Time.current)
      candidate = time.change(hour: SCHOOL_HOURS_END, min: 0, sec: 0)
      return candidate if candidate > time

      next_day = time + 1.day
      next_day = next_day + 1.day while weekend?(next_day)
      next_day.change(hour: 0, min: 0, sec: 0)
    end

    def school_hours?(time)
      return false if weekend?(time)

      local_time = time.in_time_zone
      local_time.hour >= SCHOOL_HOURS_START && local_time.hour < SCHOOL_HOURS_END
    end

    def next_school_window(time = Time.current)
      candidate = time.change(hour: SCHOOL_HOURS_START, min: 0, sec: 0)
      return candidate if candidate > time && !weekend?(candidate)

      next_day = time + 1.day
      next_day = next_day + 1.day while weekend?(next_day)
      next_day.change(hour: SCHOOL_HOURS_START, min: 0, sec: 0)
    end

    private

    def weekend?(time)
      time.saturday? || time.sunday?
    end
  end
end
