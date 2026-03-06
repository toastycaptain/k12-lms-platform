class CreateIbStandardsExports < ActiveRecord::Migration[8.1]
  def change
    add_reference :ib_standards_packets, :reviewer, foreign_key: { to_table: :users }

    create_table :ib_standards_exports do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, null: false, foreign_key: true
      t.references :ib_standards_cycle, foreign_key: true
      t.references :ib_standards_packet, null: false, foreign_key: true
      t.references :initiated_by, null: false, foreign_key: { to_table: :users }
      t.string :status, null: false, default: "queued"
      t.jsonb :snapshot_payload, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.datetime :started_at
      t.datetime :finished_at
      t.text :error_message
      t.timestamps
    end

    add_index :ib_standards_exports, [ :school_id, :status ], name: "idx_ib_standards_exports_school_status"
  end
end
