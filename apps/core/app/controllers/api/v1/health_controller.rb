class Api::V1::HealthController < ActionController::API
  def show
    checks = {
      database: check_component { database_check! },
      redis: check_component { redis_check! },
      sidekiq: sidekiq_status
    }

    critical_ok = checks[:database][:status] == "connected" &&
                  checks[:redis][:status] == "connected"

    http_status = critical_ok ? :ok : :service_unavailable

    render json: {
      status: critical_ok ? "ok" : "degraded",
      database: checks[:database][:status],
      redis: checks[:redis][:status],
      sidekiq: checks[:sidekiq],
      version: git_version,
      rails_env: Rails.env
    }, status: http_status
  end

  private

  def check_component
    yield
    { status: "connected" }
  rescue StandardError => e
    { status: "error", message: e.message }
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

  def sidekiq_status
    if defined?(Sidekiq::Queue)
      queues = Sidekiq::Queue.all.map { |queue| { name: queue.name, size: queue.size } }
      { queues: queues }
    else
      { queues: [], note: "Sidekiq not loaded" }
    end
  rescue StandardError => e
    { queues: [], error: e.message }
  end

  def git_version
    @git_version ||= ENV.fetch("GIT_SHA") do
      `git rev-parse --short HEAD 2>/dev/null`.strip.presence || "unknown"
    end
  end
end
