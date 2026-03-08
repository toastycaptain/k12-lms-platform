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
      Ib::Support::OperationalJobTracker.mark_started!(job)

      Ib::Support::TraceContext.in_span("job.perform", metadata: tags) do
        block.call
      end

      duration_ms = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at) * 1000).round(1)
      MetricsService.timing("job.duration_ms", duration_ms, tags: tags)
      MetricsService.increment("job.completed", tags: tags)
      Ib::Support::OperationalJobTracker.mark_succeeded!(job, duration_ms: duration_ms)
    rescue StandardError => e
      duration_ms = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at) * 1000).round(1)
      MetricsService.increment("job.failed", tags: tags.merge(error: e.class.name))
      Ib::Support::OperationalJobTracker.mark_failed!(job, error: e, duration_ms: duration_ms)
      raise
    end
  end
end
