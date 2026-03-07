class ExtendIbImportBatchesForPhase8MigrationControls < ActiveRecord::Migration[8.1]
  def change
    change_table :ib_import_batches, bulk: true do |t|
      t.string :source_system, null: false, default: "generic"
      t.string :import_mode, null: false, default: "draft"
      t.boolean :coexistence_mode, null: false, default: false
      t.string :source_contract_version, null: false, default: "phase8.v1"
      t.jsonb :preview_summary, null: false, default: {}
      t.jsonb :rollback_capabilities, null: false, default: {}
      t.datetime :preview_generated_at
    end

    add_index :ib_import_batches, [ :tenant_id, :school_id, :source_system, :status ], name: :idx_ib_import_batches_source_system

    change_table :ib_import_rows, bulk: true do |t|
      t.string :entity_kind
      t.string :data_loss_risk, null: false, default: "low"
      t.string :duplicate_candidate_ref
      t.jsonb :unsupported_fields, null: false, default: []
      t.jsonb :resolution_payload, null: false, default: {}
    end
  end
end
