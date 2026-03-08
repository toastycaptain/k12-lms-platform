require "digest"

module Ib
  module Support
    class OperationalJobTracker
      class << self
        def register_enqueue!(job:, operation_key:, tenant:, school: nil, actor: nil, source_record: nil, payload: {}, idempotency_key: nil)
          definition = JobCatalogService.fetch_by_key(operation_key)
          raise ArgumentError, "Unknown operational job #{operation_key}" if definition.nil?

          record = IbOperationalJob.find_or_initialize_by(tenant: tenant, active_job_id: job.job_id)
          record.assign_attributes(
            school: school,
            source_record: source_record,
            operation_key: definition[:key],
            job_class: definition[:job_class],
            queue_name: definition[:queue],
            status: "queued",
            provider_job_id: job.provider_job_id.presence || record.provider_job_id,
            idempotency_key: idempotency_key.presence || record.idempotency_key || default_idempotency_key(job, payload),
            correlation_id: Current.correlation_id,
            request_id: Current.request_id,
            runbook_key: definition[:runbook_key],
            runbook_url: definition[:runbook_url],
            enqueued_at: record.enqueued_at || Time.current,
            max_attempts: definition.dig(:retry_policy, :attempts).to_i.nonzero? || 1,
            timeout_seconds: definition[:timeout_seconds],
            retry_policy: definition[:retry_policy] || {},
            payload: record.payload.merge(normalize_hash(payload)).merge(
              "active_job_id" => job.job_id,
              "provider_job_id" => job.provider_job_id
            ),
            trace_context: TraceContext.current
          )
          record.save!

          append_event(record, actor: actor, event_type: "queued", message: "Job enqueued", payload: normalize_hash(payload))
          record
        end

        def mark_started!(job)
          record = find_record(job)
          return if record.nil?

          hydrate_current_trace!(record)
          record.update!(
            status: "running",
            provider_job_id: job.provider_job_id.presence || record.provider_job_id,
            attempts_count: execution_count(job),
            started_at: Time.current,
            trace_context: record.trace_context.merge(TraceContext.current)
          )
          append_event(record, event_type: "started", message: "Job execution started", payload: { "executions" => execution_count(job) })
        end

        def mark_succeeded!(job, duration_ms:)
          record = find_record(job)
          return if record.nil?

          record.update!(
            status: "succeeded",
            attempts_count: execution_count(job),
            finished_at: Time.current,
            last_error_class: nil,
            last_error_message: nil,
            metrics: record.metrics.merge(
              "duration_ms" => duration_ms,
              "executions" => execution_count(job)
            )
          )
          append_event(record, event_type: "succeeded", message: "Job execution completed", payload: { "duration_ms" => duration_ms })
        end

        def mark_failed!(job, error:, duration_ms:)
          record = find_record(job)
          return if record.nil?

          attempts = execution_count(job)
          exhausted = attempts >= record.max_attempts
          dead_letter = exhausted && ActiveModel::Type::Boolean.new.cast(record.retry_policy["dead_letter"] || record.retry_policy[:dead_letter])
          event_type = dead_letter ? "dead_lettered" : "failed"
          status = dead_letter ? "dead_letter" : "failed"

          record.update!(
            status: status,
            attempts_count: attempts,
            finished_at: Time.current,
            dead_lettered_at: dead_letter ? Time.current : record.dead_lettered_at,
            last_error_class: error.class.name,
            last_error_message: error.message,
            metrics: record.metrics.merge("duration_ms" => duration_ms, "executions" => attempts)
          )

          append_event(
            record,
            event_type: event_type,
            message: error.message,
            payload: {
              "error_class" => error.class.name,
              "duration_ms" => duration_ms,
              "executions" => attempts
            }
          )

          capture_sentry(record, error) if dead_letter
        end

        def mark_recovery!(record:, actor:, action:, payload: {})
          attrs = case action.to_s
          when "cancel"
            { status: "cancelled", recovered_at: Time.current, cancelled_at: Time.current }
          when "backfill"
            {}
          else
            { status: "recovered", recovered_at: Time.current }
          end
          record.update!(attrs)

          event_type = case action.to_s
          when "retry" then "retried"
          when "replay" then "replayed"
          when "backfill" then "backfill_requested"
          else "cancelled"
          end
          append_event(record, actor: actor, event_type: event_type, message: "Recovery action #{action}", payload: normalize_hash(payload))
        end

        def append_event(record, actor: nil, event_type:, message:, payload: {})
          record.events.create!(
            tenant: record.tenant,
            school: record.school,
            actor: actor,
            event_type: event_type,
            message: message,
            payload: normalize_hash(payload).merge(TraceContext.current),
            occurred_at: Time.current
          )
        end

        private

        def find_record(job)
          tenant_id = Current.tenant&.id
          scope = IbOperationalJob.all
          scope = scope.where(tenant_id: tenant_id) if tenant_id
          scope.find_by(provider_job_id: job.provider_job_id) || scope.find_by(active_job_id: job.job_id)
        end

        def execution_count(job)
          executions = job.respond_to?(:executions) ? job.executions.to_i : 1
          executions.positive? ? executions : 1
        end

        def default_idempotency_key(job, payload)
          Digest::SHA256.hexdigest([ job.class.name, normalize_hash(payload).to_json, job.job_id ].join(":"))
        end

        def normalize_hash(value)
          value.is_a?(Hash) ? value.deep_stringify_keys : {}
        end

        def capture_sentry(record, error)
          Sentry.capture_exception(
            error,
            extra: {
              operation_key: record.operation_key,
              queue_name: record.queue_name,
              source_record_type: record.source_record_type,
              source_record_id: record.source_record_id,
              correlation_id: record.correlation_id,
              request_id: record.request_id
            },
            tags: {
              ib_operational_job: record.operation_key,
              ib_queue: record.queue_name,
              ib_status: record.status
            }
          )
        rescue StandardError
          nil
        end

        def hydrate_current_trace!(record)
          Current.request_id ||= record.request_id
          Current.correlation_id ||= record.correlation_id
          Current.trace_id ||= record.trace_context["trace_id"] || record.trace_context[:trace_id]
          Current.span_id ||= record.trace_context["span_id"] || record.trace_context[:span_id]
        end
      end
    end
  end
end
