class CreateIbPhase10OperationalReliability < ActiveRecord::Migration[8.1]
  def change
    create_table :ib_operational_jobs do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, foreign_key: true
      t.string :operation_key, null: false
      t.string :job_class, null: false
      t.string :queue_name, null: false
      t.string :status, null: false, default: "queued"
      t.string :active_job_id
      t.string :provider_job_id
      t.string :idempotency_key
      t.string :correlation_id
      t.string :request_id
      t.string :runbook_key
      t.string :runbook_url
      t.string :source_record_type
      t.bigint :source_record_id
      t.string :last_error_class
      t.text :last_error_message
      t.integer :attempts_count, null: false, default: 0
      t.integer :max_attempts, null: false, default: 1
      t.integer :timeout_seconds
      t.datetime :enqueued_at
      t.datetime :started_at
      t.datetime :finished_at
      t.datetime :dead_lettered_at
      t.datetime :cancelled_at
      t.datetime :recovered_at
      t.jsonb :retry_policy, null: false, default: {}
      t.jsonb :payload, null: false, default: {}
      t.jsonb :metrics, null: false, default: {}
      t.jsonb :trace_context, null: false, default: {}
      t.timestamps
    end

    add_index :ib_operational_jobs, [ :tenant_id, :operation_key, :status ], name: :idx_ib_operational_jobs_lookup
    add_index :ib_operational_jobs, [ :tenant_id, :active_job_id ], unique: true, name: :idx_ib_operational_jobs_active_ref
    add_index :ib_operational_jobs, [ :tenant_id, :provider_job_id ], unique: true, name: :idx_ib_operational_jobs_provider_ref
    add_index :ib_operational_jobs, [ :source_record_type, :source_record_id ], name: :idx_ib_operational_jobs_source_record
    add_index :ib_operational_jobs, :correlation_id

    create_table :ib_operational_job_events do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, foreign_key: true
      t.references :ib_operational_job, null: false, foreign_key: true
      t.references :actor, foreign_key: { to_table: :users }
      t.string :event_type, null: false
      t.text :message
      t.jsonb :payload, null: false, default: {}
      t.datetime :occurred_at, null: false
      t.timestamps
    end

    add_index :ib_operational_job_events, [ :ib_operational_job_id, :occurred_at ], name: :idx_ib_operational_job_events_timeline
    add_index :ib_operational_job_events, [ :tenant_id, :event_type ], name: :idx_ib_operational_job_events_lookup

    add_column :ib_import_batches, :resume_cursor, :integer, null: false, default: 0
    add_column :ib_import_batches, :recovery_payload, :jsonb, null: false, default: {}
    add_column :ib_import_batches, :last_enqueued_job_id, :bigint
    add_index :ib_import_batches, [ :tenant_id, :status, :resume_cursor ], name: :idx_ib_import_batches_resume

    add_column :ib_report_deliveries, :artifact_url, :string
    add_column :ib_report_deliveries, :failure_payload, :jsonb, null: false, default: {}
    add_index :ib_report_deliveries, [ :tenant_id, :status, :channel ], name: :idx_ib_report_deliveries_status

    add_index :ib_publishing_queue_items, [ :tenant_id, :school_id, :state, :scheduled_for ], name: :idx_ib_publishing_queue_items_state
    add_index :ib_mobile_sync_diagnostics, [ :tenant_id, :school_id, :status, :workflow_key ], name: :idx_ib_mobile_sync_diagnostics_health
  end
end
