require "json"

class MetricsService
  class << self
    def increment(metric, tags: {}, value: 1)
      emit(type: "counter", metric: metric, value: value, tags: tags)
    end

    def timing(metric, duration_ms, tags: {})
      emit(type: "timing", metric: metric, value: duration_ms.to_f.round(1), tags: tags)
    end

    def gauge(metric, value, tags: {})
      emit(type: "gauge", metric: metric, value: value, tags: tags)
    end

    private

    def emit(type:, metric:, value:, tags:)
      payload = {
        type: type,
        metric: metric,
        value: value,
        tags: compact_tags(tags),
        recorded_at: Time.current.utc.iso8601(3)
      }

      Rails.logger.info(payload.to_json)
    rescue StandardError => e
      Rails.logger.warn("metrics_emit_failed metric=#{metric} error=#{e.class}: #{e.message}")
    end

    def compact_tags(tags)
      (tags || {}).each_with_object({}) do |(key, value), memo|
        next if value.nil?

        memo[key.to_s] = value
      end
    end
  end
end
