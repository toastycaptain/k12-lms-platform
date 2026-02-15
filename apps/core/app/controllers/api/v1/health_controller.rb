module Api
  module V1
    class HealthController < ActionController::API
      def show
        checks = {
          database: check_component { database_check! },
          cache: check_component { cache_check! },
          queue: check_component { queue_check! }
        }

        healthy = checks.values.all? { |value| value == "ok" }
        status_code = healthy ? :ok : :service_unavailable

        render json: {
          status: healthy ? "ok" : "degraded",
          checks: checks
        }, status: status_code
      end

      private

      def check_component
        yield
        "ok"
      rescue StandardError => e
        "error: #{e.class}"
      end

      def database_check!
        ActiveRecord::Base.connection.execute("SELECT 1")
      end

      def cache_check!
        return if Rails.cache.is_a?(ActiveSupport::Cache::NullStore)

        key = "health_check:#{SecureRandom.hex(8)}"
        Rails.cache.write(key, "ok", expires_in: 60)
        value = Rails.cache.read(key)
        raise "cache read/write failed" unless value == "ok"
      ensure
        Rails.cache.delete(key) if defined?(key)
      end

      def queue_check!
        if defined?(SolidQueue::Job)
          SolidQueue::Job.limit(1).count
        else
          ActiveRecord::Base.connection.execute("SELECT 1")
        end
      end
    end
  end
end
