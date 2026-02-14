class CreateSyncLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :sync_logs do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.references :sync_run, null: false, foreign_key: true, index: true
      t.string :level, null: false, default: "info"
      t.text :message, null: false
      t.string :entity_type
      t.bigint :entity_id
      t.string :external_id
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
  end
end
