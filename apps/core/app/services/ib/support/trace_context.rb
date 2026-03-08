require "securerandom"

module Ib
  module Support
    class TraceContext
      class << self
        def build(request_id:, correlation_id: nil, traceparent: nil)
          trace_id = parse_trace_id(traceparent) || SecureRandom.hex(16)
          span_id = SecureRandom.hex(8)

          {
            request_id: request_id,
            correlation_id: correlation_id.presence || request_id,
            trace_id: trace_id,
            span_id: span_id,
            traceparent: format_traceparent(trace_id: trace_id, span_id: span_id)
          }
        end

        def current
          {
            request_id: Current.request_id,
            correlation_id: Current.correlation_id,
            trace_id: Current.trace_id,
            span_id: Current.span_id,
            traceparent: traceparent_for_current
          }.compact
        end

        def in_span(name, metadata: {})
          started_at = monotonic_now
          previous_span_id = Current.span_id
          Current.span_id = SecureRandom.hex(8)

          log_span("otel.span.start", name: name, metadata: metadata)
          yield(current)
        ensure
          duration_ms = ((monotonic_now - started_at) * 1000).round(1)
          MetricsService.timing("ib.trace.duration_ms", duration_ms, tags: span_tags(name, metadata))
          log_span("otel.span.finish", name: name, metadata: metadata.merge(duration_ms: duration_ms))
          Current.span_id = previous_span_id
        end

        private

        def parse_trace_id(traceparent)
          return nil if traceparent.blank?

          parts = traceparent.to_s.split("-")
          return nil unless parts.length >= 4

          parts[1].presence
        end

        def traceparent_for_current
          return nil if Current.trace_id.blank? || Current.span_id.blank?

          format_traceparent(trace_id: Current.trace_id, span_id: Current.span_id)
        end

        def format_traceparent(trace_id:, span_id:)
          "00-#{trace_id}-#{span_id}-01"
        end

        def span_tags(name, metadata)
          {
            span_name: name,
            trace_id: Current.trace_id,
            surface: metadata[:surface] || metadata["surface"],
            route_id: metadata[:route_id] || metadata["route_id"]
          }
        end

        def log_span(event_name, name:, metadata:)
          Rails.logger.info(
            {
              event: event_name,
              name: name,
              request_id: Current.request_id,
              correlation_id: Current.correlation_id,
              trace_id: Current.trace_id,
              span_id: Current.span_id,
              metadata: metadata
            }.to_json
          )
        rescue StandardError
          nil
        end

        def monotonic_now
          Process.clock_gettime(Process::CLOCK_MONOTONIC)
        end
      end
    end
  end
end
