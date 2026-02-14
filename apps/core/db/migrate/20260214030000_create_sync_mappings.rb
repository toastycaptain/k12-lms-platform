class CreateSyncMappings < ActiveRecord::Migration[8.1]
  def change
    create_table :sync_mappings do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.references :integration_config, null: false, foreign_key: true, index: true
      t.string :local_type, null: false
      t.bigint :local_id, null: false
      t.string :external_id, null: false
      t.string :external_type, null: false
      t.jsonb :metadata, null: false, default: {}
      t.datetime :last_synced_at
      t.timestamps
    end
    add_index :sync_mappings, [ :integration_config_id, :local_type, :local_id ], unique: true,
      name: "idx_sync_mappings_local_unique"
    add_index :sync_mappings, [ :integration_config_id, :external_type, :external_id ], unique: true,
      name: "idx_sync_mappings_external_unique"
  end
end
