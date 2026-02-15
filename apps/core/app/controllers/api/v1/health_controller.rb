class Api::V1::HealthController < ActionController::API
  def show
    checks = {
      database: check_component { database_check! },
      redis: check_component { redis_check! }
    }

    status = checks.values.all? { |v| v == "ok" } ? :ok : :service_unavailable
    render json: { status: status == :ok ? "ok" : "degraded", checks: checks }, status: status
  end

  private

  def check_component
    yield
    "ok"
  rescue StandardError => e
    "error: #{e.message}"
  end

  def database_check!
    ActiveRecord::Base.connection.execute("SELECT 1")
  end

  def redis_check!
    if defined?(Redis)
      redis = Redis.new(url: ENV["REDIS_URL"])
      redis.ping
    else
      redis_client = RedisClient.config(url: ENV["REDIS_URL"]).new_client
      redis_client.call("PING")
    end
  end
end
