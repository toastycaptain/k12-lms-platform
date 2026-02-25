class CreateBackupRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :backup_records do |t|
      t.string :backup_type, null: false, default: "full"
      t.string :status, null: false, default: "in_progress"
      t.string :s3_key, null: false
      t.string :s3_bucket, null: false
      t.bigint :size_bytes
      t.integer :duration_seconds
      t.jsonb :metadata, null: false, default: {}
      t.string :error_message
      t.datetime :verified_at
      t.jsonb :verification_result, null: false, default: {}

      t.timestamps
    end

    add_index :backup_records, :status
    add_index :backup_records, :created_at
    add_index :backup_records, [ :backup_type, :status ]
  end
end
