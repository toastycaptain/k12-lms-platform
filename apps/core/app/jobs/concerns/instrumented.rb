module Instrumented
  extend ActiveSupport::Concern

  included do
    around_perform do |job, block|
      started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
      tags = {
        job: job.class.name,
        queue: job.queue_name
      }

      MetricsService.increment("job.started", tags: tags)

      block.call

      duration_ms = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at) * 1000).round(1)
      MetricsService.timing("job.duration_ms", duration_ms, tags: tags)
      MetricsService.increment("job.completed", tags: tags)
    rescue StandardError => e
      MetricsService.increment("job.failed", tags: tags.merge(error: e.class.name))
      raise
    end
  end
end
