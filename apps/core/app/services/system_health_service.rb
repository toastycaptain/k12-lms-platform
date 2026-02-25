class SystemHealthService
  class << self
    def check_all
      {
        timestamp: Time.current.iso8601,
        overall: overall_status,
        checks: {
          database: database_health,
          redis: redis_health,
          sidekiq: sidekiq_health,
          storage: storage_health,
          ai_gateway: ai_gateway_health
        },
        metrics: {
          db_connection_pool: db_connection_pool_usage,
          db_response_time: db_response_time,
          sidekiq_queue_depth: sidekiq_queue_depth,
          sidekiq_latency: sidekiq_latency,
          memory_usage_percent: memory_usage,
          backup_age_hours: backup_age_hours
        }
      }
    end

    def overall_status
      checks = [ database_health, redis_health, sidekiq_health ]
      return "critical" if checks.any? { |check| check[:status] == "critical" }
      return "warning" if checks.any? { |check| check[:status] == "warning" }

      "healthy"
    end

    def database_health
      start_time = monotonic_now
      ActiveRecord::Base.connection.execute("SELECT 1")
      latency = ((monotonic_now - start_time) * 1000).round(2)

      {
        status: latency > 500 ? "warning" : "healthy",
        latency_ms: latency
      }
    rescue StandardError => e
      { status: "critical", error: e.message }
    end

    def redis_health
      start_time = monotonic_now
      Redis.new(url: ENV.fetch("REDIS_URL", nil)).ping
      latency = ((monotonic_now - start_time) * 1000).round(2)

      { status: "healthy", latency_ms: latency }
    rescue StandardError => e
      { status: "critical", error: e.message }
    end

    def sidekiq_health
      stats = Sidekiq::Stats.new
      queue_size = stats.enqueued
      status = if queue_size > 1000
        "critical"
      elsif queue_size > 100
        "warning"
      else
        "healthy"
      end

      {
        status: status,
        enqueued: queue_size,
        processed: stats.processed,
        failed: stats.failed,
        workers: Sidekiq::Workers.new.size
      }
    rescue StandardError => e
      { status: "critical", error: e.message }
    end

    def storage_health
      service = ActiveStorage::Blob.service
      { status: "healthy", service: service.class.name }
    rescue StandardError => e
      { status: "critical", error: e.message }
    end

    def ai_gateway_health
      url = ENV.fetch("AI_GATEWAY_URL", "http://localhost:8000")
      response = Faraday.get("#{url}/v1/health") { |request| request.options.timeout = 5 }

      {
        status: response.status == 200 ? "healthy" : "warning",
        http_status: response.status
      }
    rescue StandardError => e
      { status: "critical", error: e.message }
    end

    def db_connection_pool_usage
      pool = ActiveRecord::Base.connection_pool
      stat = pool.stat
      return 0.0 if stat[:size].to_i.zero?

      ((stat[:busy].to_f / stat[:size].to_f) * 100).round(1)
    rescue StandardError
      0.0
    end

    def db_response_time
      start_time = monotonic_now
      ActiveRecord::Base.connection.execute("SELECT 1")
      ((monotonic_now - start_time) * 1000).round(2)
    rescue StandardError
      -1.0
    end

    def sidekiq_queue_depth
      Sidekiq::Stats.new.enqueued
    rescue StandardError
      -1
    end

    def sidekiq_latency
      Sidekiq::Queue.new.latency.round(2)
    rescue StandardError
      -1.0
    end

    def memory_usage
      if File.exist?("/proc/meminfo")
        meminfo = File.read("/proc/meminfo")
        total = meminfo[/MemTotal:\s+(\d+)/, 1].to_f
        available = meminfo[/MemAvailable:\s+(\d+)/, 1].to_f
        return 0.0 if total.zero?

        ((1 - available / total) * 100).round(1)
      else
        `memory_pressure 2>/dev/null`[/(\d+)%/, 1]&.to_f || 0.0 # rubocop:disable Style/GlobalStdStream
      end
    rescue StandardError
      0.0
    end

    def backup_age_hours
      latest = BackupRecord.where(status: %w[completed verified]).order(created_at: :desc).first
      return -1 if latest.nil?

      ((Time.current - latest.created_at) / 3600.0).round(1)
    rescue StandardError
      -1
    end

    private

    def monotonic_now
      Process.clock_gettime(Process::CLOCK_MONOTONIC)
    end
  end
end
