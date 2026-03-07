class CreateIbPhase9Models < ActiveRecord::Migration[8.1]
  def change
    create_table :ib_pilot_profiles do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, foreign_key: true
      t.references :academic_year, foreign_key: true
      t.references :created_by, foreign_key: { to_table: :users }
      t.string :name, null: false
      t.string :status, null: false, default: "draft"
      t.string :cohort_key, null: false
      t.string :archetype_key, null: false
      t.string :programme_scope, null: false, default: "Mixed"
      t.string :launch_window
      t.date :go_live_target_on
      t.jsonb :role_success_metrics, null: false, default: {}
      t.jsonb :baseline_summary, null: false, default: {}
      t.jsonb :readiness_summary, null: false, default: {}
      t.jsonb :rollout_bundle, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :ib_pilot_profiles, [ :tenant_id, :school_id, :cohort_key ], unique: true, name: :idx_ib_pilot_profiles_scope

    create_table :ib_pilot_baseline_snapshots do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, foreign_key: true
      t.references :ib_pilot_profile, null: false, foreign_key: true
      t.references :captured_by, foreign_key: { to_table: :users }
      t.string :status, null: false, default: "captured"
      t.datetime :captured_at, null: false
      t.jsonb :metric_payload, null: false, default: {}
      t.jsonb :benchmark_payload, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :ib_pilot_baseline_snapshots, [ :tenant_id, :ib_pilot_profile_id, :captured_at ], name: :idx_ib_pilot_baselines_lookup

    create_table :ib_pilot_feedback_items do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, foreign_key: true
      t.references :ib_pilot_profile, foreign_key: true
      t.references :user, foreign_key: true
      t.string :status, null: false, default: "new"
      t.string :sentiment, null: false, default: "neutral"
      t.string :category, null: false, default: "general"
      t.string :role_scope, null: false, default: "teacher"
      t.string :surface, null: false, default: "unknown"
      t.string :title, null: false
      t.text :detail
      t.jsonb :tags, null: false, default: []
      t.jsonb :routing_payload, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :ib_pilot_feedback_items, [ :tenant_id, :status, :category ], name: :idx_ib_pilot_feedback_triage

    create_table :ib_migration_sessions do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, foreign_key: true
      t.references :academic_year, foreign_key: true
      t.references :ib_pilot_profile, foreign_key: true
      t.references :initiated_by, foreign_key: { to_table: :users }
      t.references :ib_import_batch, foreign_key: true
      t.string :source_system, null: false
      t.string :status, null: false, default: "disconnected"
      t.string :cutover_state, null: false, default: "disconnected"
      t.string :session_key, null: false
      t.jsonb :source_inventory, null: false, default: {}
      t.jsonb :mapping_summary, null: false, default: {}
      t.jsonb :dry_run_summary, null: false, default: {}
      t.jsonb :reconciliation_summary, null: false, default: {}
      t.jsonb :rollback_summary, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.datetime :archived_at
      t.timestamps
    end
    add_index :ib_migration_sessions, [ :tenant_id, :school_id, :session_key ], unique: true, name: :idx_ib_migration_sessions_scope

    create_table :ib_migration_mapping_templates do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, foreign_key: true
      t.references :created_by, foreign_key: { to_table: :users }
      t.string :source_system, null: false
      t.string :programme, null: false, default: "Mixed"
      t.string :name, null: false
      t.string :status, null: false, default: "draft"
      t.boolean :shared, null: false, default: false
      t.jsonb :field_mappings, null: false, default: {}
      t.jsonb :transform_library, null: false, default: {}
      t.jsonb :role_mapping_rules, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    create_table :ib_report_cycles do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, foreign_key: true
      t.references :academic_year, foreign_key: true
      t.references :created_by, foreign_key: { to_table: :users }
      t.references :owner, foreign_key: { to_table: :users }
      t.string :programme, null: false, default: "Mixed"
      t.string :cycle_key, null: false
      t.string :status, null: false, default: "draft"
      t.date :starts_on
      t.date :ends_on
      t.date :due_on
      t.jsonb :delivery_window, null: false, default: {}
      t.jsonb :localization_settings, null: false, default: {}
      t.jsonb :approval_summary, null: false, default: {}
      t.jsonb :metrics, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :ib_report_cycles, [ :tenant_id, :school_id, :cycle_key ], unique: true, name: :idx_ib_report_cycles_scope

    create_table :ib_report_templates do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, foreign_key: true
      t.references :created_by, foreign_key: { to_table: :users }
      t.string :programme, null: false, default: "Mixed"
      t.string :audience, null: false, default: "internal"
      t.string :family, null: false, default: "conference_packet"
      t.string :name, null: false
      t.string :status, null: false, default: "draft"
      t.string :schema_version, null: false, default: "phase9.v1"
      t.jsonb :section_definitions, null: false, default: {}
      t.jsonb :translation_rules, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    add_reference :ib_reports, :ib_report_cycle, foreign_key: true
    add_reference :ib_reports, :ib_report_template, foreign_key: true
    add_column :ib_reports, :localized_locale, :string

    create_table :ib_collaboration_events do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, foreign_key: true
      t.references :curriculum_document, foreign_key: true
      t.references :ib_collaboration_session, foreign_key: true
      t.references :user, foreign_key: true
      t.string :event_name, null: false
      t.string :route_id
      t.string :scope_key, null: false
      t.string :section_key
      t.boolean :durable, null: false, default: false
      t.jsonb :payload, null: false, default: {}
      t.datetime :occurred_at, null: false
      t.timestamps
    end
    add_index :ib_collaboration_events, [ :tenant_id, :curriculum_document_id, :occurred_at ], name: :idx_ib_collaboration_events_document

    create_table :ib_collaboration_tasks do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, foreign_key: true
      t.references :curriculum_document, foreign_key: true
      t.references :created_by, foreign_key: { to_table: :users }
      t.references :assigned_to, foreign_key: { to_table: :users }
      t.string :status, null: false, default: "open"
      t.string :priority, null: false, default: "medium"
      t.string :title, null: false
      t.text :detail
      t.date :due_on
      t.string :section_key
      t.jsonb :mention_payload, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :ib_collaboration_tasks, [ :tenant_id, :school_id, :status ], name: :idx_ib_collaboration_tasks_scope

    create_table :ib_benchmark_snapshots do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, foreign_key: true
      t.references :ib_pilot_profile, foreign_key: true
      t.references :captured_by, foreign_key: { to_table: :users }
      t.string :benchmark_version, null: false, default: "phase9.v1"
      t.string :status, null: false, default: "baseline"
      t.string :role_scope, null: false, default: "teacher"
      t.string :workflow_family, null: false, default: "planning"
      t.datetime :captured_at, null: false
      t.jsonb :metrics, null: false, default: {}
      t.jsonb :thresholds, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :ib_benchmark_snapshots, [ :tenant_id, :school_id, :benchmark_version ], name: :idx_ib_benchmark_snapshots_scope

    create_table :ib_intelligence_metric_definitions do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, foreign_key: true
      t.references :created_by, foreign_key: { to_table: :users }
      t.string :key, null: false
      t.string :status, null: false, default: "draft"
      t.string :metric_family, null: false, default: "programme_health"
      t.string :label, null: false
      t.text :definition
      t.string :version, null: false, default: "phase9.v1"
      t.jsonb :source_of_truth, null: false, default: {}
      t.jsonb :threshold_config, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :ib_intelligence_metric_definitions, [ :tenant_id, :key, :version ], unique: true, name: :idx_ib_intelligence_metrics_lookup

    create_table :ib_trust_policies do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, foreign_key: true
      t.references :created_by, foreign_key: { to_table: :users }
      t.string :audience, null: false, default: "guardian"
      t.string :content_type, null: false, default: "story"
      t.string :status, null: false, default: "active"
      t.string :cadence_mode, null: false, default: "weekly_digest"
      t.string :delivery_mode, null: false, default: "digest"
      t.string :approval_mode, null: false, default: "teacher_reviewed"
      t.jsonb :policy_rules, null: false, default: {}
      t.jsonb :privacy_rules, null: false, default: {}
      t.jsonb :localization_rules, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :ib_trust_policies, [ :tenant_id, :school_id, :audience, :content_type ], unique: true, name: :idx_ib_trust_policies_scope

    create_table :ib_mobile_sync_diagnostics do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, foreign_key: true
      t.references :user, foreign_key: true
      t.string :device_class, null: false, default: "phone"
      t.string :workflow_key, null: false
      t.string :status, null: false, default: "healthy"
      t.integer :queue_depth, null: false, default: 0
      t.datetime :last_synced_at
      t.jsonb :failure_payload, null: false, default: {}
      t.jsonb :diagnostics, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :ib_mobile_sync_diagnostics, [ :tenant_id, :school_id, :workflow_key ], name: :idx_ib_mobile_sync_diagnostics_scope

    create_table :ib_search_profiles do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, foreign_key: true
      t.references :created_by, foreign_key: { to_table: :users }
      t.string :key, null: false
      t.string :status, null: false, default: "draft"
      t.integer :latency_budget_ms, null: false, default: 800
      t.jsonb :facet_config, null: false, default: {}
      t.jsonb :ranking_rules, null: false, default: {}
      t.jsonb :scope_rules, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :ib_search_profiles, [ :tenant_id, :school_id, :key ], unique: true, name: :idx_ib_search_profiles_scope

    create_table :ib_replacement_readiness_snapshots do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, foreign_key: true
      t.references :ib_pilot_profile, foreign_key: true
      t.references :captured_by, foreign_key: { to_table: :users }
      t.string :status, null: false, default: "draft"
      t.datetime :generated_at, null: false
      t.datetime :archived_at
      t.jsonb :readiness_summary, null: false, default: {}
      t.jsonb :gap_summary, null: false, default: {}
      t.jsonb :export_payload, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :ib_replacement_readiness_snapshots, [ :tenant_id, :school_id, :generated_at ], name: :idx_ib_replacement_readiness_scope
  end
end
