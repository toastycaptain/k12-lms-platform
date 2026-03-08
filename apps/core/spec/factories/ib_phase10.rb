FactoryBot.define do
  factory :ib_operational_job do
    association :tenant
    school { association :school, tenant: tenant }
    operation_key { "import_execute" }
    job_class { "Ib::Migration::ImportExecutionJob" }
    queue_name { "ib_imports" }
    status { "queued" }
    active_job_id { SecureRandom.uuid }
    provider_job_id { SecureRandom.hex(8) }
    idempotency_key { SecureRandom.hex(12) }
    correlation_id { SecureRandom.hex(8) }
    request_id { SecureRandom.uuid }
    runbook_key { "migration-pipeline" }
    runbook_url { "/admin/ib/runbooks#migration-pipeline" }
    retry_policy { { "mode" => "manual_or_auto", "attempts" => 2, "dead_letter" => true } }
    payload { {} }
    metrics { {} }
    trace_context { {} }
    enqueued_at { Time.current }
  end

  factory :ib_operational_job_event do
    association :ib_operational_job
    tenant { ib_operational_job.tenant }
    school { ib_operational_job.school }
    actor { association :user, tenant: tenant }
    event_type { "queued" }
    message { "Job enqueued" }
    payload { {} }
    occurred_at { Time.current }
  end
end
