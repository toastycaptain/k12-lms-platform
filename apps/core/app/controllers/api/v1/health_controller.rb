class Api::V1::HealthController < ActionController::API
  def show
    checks = {
      database: check_database,
      redis: check_redis,
      sidekiq: check_sidekiq,
      ai_gateway: check_ai_gateway,
      migrations: check_migrations
    }

    healthy = checks.values.all? { |check| healthy_check?(check) }
    status_code = healthy ? :ok : :service_unavailable

    render json: health_payload(checks, healthy), status: status_code
  end

  private

  def health_payload(checks, healthy)
    {
      status: healthy ? "healthy" : "degraded",
      checks: checks,
      version: git_version,
      rails_env: Rails.env
    }
  end

  def healthy_check?(check)
    %w[ok skipped].include?(check[:status])
  end

  def check_database
    database_check!
    { status: "ok" }
  rescue StandardError => e
    { status: "error", message: e.message }
  end

  def check_redis
    redis_url = ENV["REDIS_URL"].to_s
    return { status: "skipped", message: "REDIS_URL not configured" } if redis_url.blank?

    redis_check!(redis_url)
    { status: "ok" }
  rescue StandardError => e
    { status: "error", message: e.message }
  end

  def database_check!
    ActiveRecord::Base.connection.execute("SELECT 1")
  end

  def redis_check!(redis_url)
    if defined?(Redis)
      redis = Redis.new(url: redis_url)
      redis.ping
    else
      redis_client = RedisClient.config(url: redis_url).new_client
      redis_client.call("PING")
    end
  end

  def check_sidekiq
    if defined?(Sidekiq::Queue)
      queues = Sidekiq::Queue.all.map { |queue| { name: queue.name, size: queue.size } }
      process_count = defined?(Sidekiq::ProcessSet) ? Sidekiq::ProcessSet.new.size : 0
      { status: "ok", queues: queues, processes: process_count }
    else
      { status: "skipped", queues: [], message: "Sidekiq not loaded" }
    end
  rescue StandardError => e
    { status: "error", queues: [], message: e.message }
  end

  def check_ai_gateway
    gateway_url = ENV["AI_GATEWAY_URL"].to_s
    return { status: "skipped", message: "AI_GATEWAY_URL not configured" } if gateway_url.blank?

    response = Faraday.new(url: gateway_url) do |connection|
      connection.options.open_timeout = 2
      connection.options.timeout = 2
    end.get("/v1/health")

    if response.status.between?(200, 299)
      { status: "ok", http_status: response.status }
    else
      { status: "error", http_status: response.status, message: "Unexpected gateway status" }
    end
  rescue StandardError => e
    { status: "error", message: e.message }
  end

  def check_migrations
    ActiveRecord::Migration.check_pending!
    { status: "ok" }
  rescue ActiveRecord::PendingMigrationError => e
    { status: "error", message: e.message }
  rescue StandardError => e
    { status: "error", message: e.message }
  end

  def git_version
    @git_version ||= ENV.fetch("GIT_SHA") do
      `git rev-parse --short HEAD 2>/dev/null`.strip.presence || "unknown"
    end
  end
end
