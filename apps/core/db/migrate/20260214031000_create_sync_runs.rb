class CreateSyncRuns < ActiveRecord::Migration[8.1]
  def change
    create_table :sync_runs do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.references :integration_config, null: false, foreign_key: true, index: true
      t.string :sync_type, null: false
      t.string :direction, null: false, default: "push"
      t.string :status, null: false, default: "pending"
      t.datetime :started_at
      t.datetime :completed_at
      t.integer :records_processed, null: false, default: 0
      t.integer :records_succeeded, null: false, default: 0
      t.integer :records_failed, null: false, default: 0
      t.text :error_message
      t.references :triggered_by, foreign_key: { to_table: :users }
      t.timestamps
    end
  end
end
