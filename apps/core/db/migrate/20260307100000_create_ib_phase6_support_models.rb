class CreateIbPhase6SupportModels < ActiveRecord::Migration[8.1]
  def change
    create_table :ib_pilot_setups do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, null: false, foreign_key: true
      t.string :programme, null: false, default: "Mixed"
      t.string :status, null: false, default: "not_started"
      t.jsonb :feature_flag_bundle, null: false, default: {}
      t.jsonb :setup_steps, null: false, default: {}
      t.jsonb :owner_assignments, null: false, default: {}
      t.jsonb :status_details, null: false, default: {}
      t.jsonb :baseline_metadata, null: false, default: {}
      t.text :paused_reason
      t.datetime :last_validated_at
      t.datetime :activated_at
      t.datetime :paused_at
      t.datetime :retired_at
      t.references :created_by, null: true, foreign_key: { to_table: :users }
      t.references :updated_by, null: true, foreign_key: { to_table: :users }
      t.timestamps
    end

    add_index :ib_pilot_setups, [ :tenant_id, :school_id, :programme ], unique: true, name: :index_ib_pilot_setups_on_scope

    create_table :ib_import_batches do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, null: false, foreign_key: true
      t.references :academic_year, null: true, foreign_key: true
      t.string :programme, null: false, default: "Mixed"
      t.string :status, null: false, default: "uploaded"
      t.string :source_kind, null: false
      t.string :source_format, null: false
      t.string :source_filename, null: false
      t.string :source_checksum
      t.text :raw_payload
      t.jsonb :scope_metadata, null: false, default: {}
      t.jsonb :mapping_payload, null: false, default: {}
      t.jsonb :validation_summary, null: false, default: {}
      t.jsonb :dry_run_summary, null: false, default: {}
      t.jsonb :execution_summary, null: false, default: {}
      t.jsonb :rollback_summary, null: false, default: {}
      t.jsonb :parser_warnings, null: false, default: []
      t.text :error_message
      t.datetime :last_dry_run_at
      t.datetime :executed_at
      t.datetime :rolled_back_at
      t.datetime :failed_at
      t.references :initiated_by, null: true, foreign_key: { to_table: :users }
      t.references :executed_by, null: true, foreign_key: { to_table: :users }
      t.timestamps
    end

    add_index :ib_import_batches, [ :tenant_id, :school_id, :status ], name: :index_ib_import_batches_on_scope_and_status

    create_table :ib_import_rows do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :ib_import_batch, null: false, foreign_key: true
      t.integer :row_index, null: false
      t.string :sheet_name
      t.string :source_identifier
      t.string :status, null: false, default: "staged"
      t.jsonb :source_payload, null: false, default: {}
      t.jsonb :normalized_payload, null: false, default: {}
      t.jsonb :mapping_payload, null: false, default: {}
      t.jsonb :warnings, null: false, default: []
      t.jsonb :errors, null: false, default: []
      t.jsonb :conflict_payload, null: false, default: {}
      t.jsonb :execution_payload, null: false, default: {}
      t.string :target_entity_ref
      t.timestamps
    end

    add_index :ib_import_rows, [ :ib_import_batch_id, :row_index ], unique: true
    add_index :ib_import_rows, [ :ib_import_batch_id, :status ]

    add_column :notifications, :dedupe_key, :string
    add_index :notifications, [ :tenant_id, :user_id, :notification_type, :dedupe_key ], unique: true, where: "dedupe_key IS NOT NULL", name: :index_notifications_on_dedupe_key
  end
end
