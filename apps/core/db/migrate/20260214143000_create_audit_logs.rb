class CreateAuditLogs < ActiveRecord::Migration[8.1]
  def up
    create_audit_logs_table unless table_exists?(:audit_logs)

    ensure_column :audit_logs, :actor_id, :bigint
    ensure_column :audit_logs, :event_type, :string
    ensure_column :audit_logs, :request_id, :string
    ensure_column :audit_logs, :ip_address, :string
    ensure_column :audit_logs, :user_agent, :text
    ensure_column :audit_logs, :metadata, :jsonb, default: {}, null: false
    ensure_column :audit_logs, :created_at, :datetime, null: false

    migrate_legacy_columns!
    normalize_audit_log_constraints!
    ensure_indexes!
    ensure_foreign_keys!
  end

  def down
    drop_table :audit_logs if table_exists?(:audit_logs)
  end

  private

  def create_audit_logs_table
    create_table :audit_logs do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :actor, null: true, foreign_key: { to_table: :users }
      t.string :event_type, null: false
      t.references :auditable, polymorphic: true, null: true
      t.string :request_id
      t.string :ip_address
      t.text :user_agent
      t.jsonb :metadata, null: false, default: {}
      t.datetime :created_at, null: false
    end
  end

  def ensure_column(table_name, column_name, type, **options)
    return if column_exists?(table_name, column_name)

    add_column table_name, column_name, type, **options
  end

  def migrate_legacy_columns!
    if column_exists?(:audit_logs, :user_id)
      execute <<~SQL.squish
        UPDATE audit_logs
        SET actor_id = user_id
        WHERE actor_id IS NULL AND user_id IS NOT NULL
      SQL
      remove_foreign_key :audit_logs, column: :user_id if foreign_key_exists?(:audit_logs, column: :user_id)
      remove_index :audit_logs, :user_id if index_exists?(:audit_logs, :user_id)
      remove_column :audit_logs, :user_id
    end

    if column_exists?(:audit_logs, :action)
      execute <<~SQL.squish
        UPDATE audit_logs
        SET event_type = action
        WHERE event_type IS NULL AND action IS NOT NULL
      SQL
      remove_index :audit_logs, [ :tenant_id, :action, :created_at ] if index_exists?(:audit_logs, [ :tenant_id, :action, :created_at ])
      remove_column :audit_logs, :action
    end

    if column_exists?(:audit_logs, :changes_data)
      execute <<~SQL.squish
        UPDATE audit_logs
        SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('changes_data', changes_data)
        WHERE changes_data IS NOT NULL
      SQL
      remove_column :audit_logs, :changes_data
    end

    remove_column :audit_logs, :archived_at if column_exists?(:audit_logs, :archived_at)
  end

  def normalize_audit_log_constraints!
    execute "UPDATE audit_logs SET metadata = '{}'::jsonb WHERE metadata IS NULL"
    execute "UPDATE audit_logs SET event_type = 'legacy.unknown' WHERE event_type IS NULL"

    change_column_default :audit_logs, :metadata, {}
    change_column_null :audit_logs, :metadata, false
    change_column_null :audit_logs, :event_type, false
    change_column_null :audit_logs, :tenant_id, false if column_exists?(:audit_logs, :tenant_id)
    change_column_null :audit_logs, :created_at, false if column_exists?(:audit_logs, :created_at)
  end

  def ensure_indexes!
    add_index :audit_logs, :tenant_id unless index_exists?(:audit_logs, :tenant_id)
    add_index :audit_logs, :actor_id unless index_exists?(:audit_logs, :actor_id)
    add_index :audit_logs, [ :auditable_type, :auditable_id ], name: "index_audit_logs_on_auditable" unless index_exists?(:audit_logs, [ :auditable_type, :auditable_id ])
    add_index :audit_logs, :event_type unless index_exists?(:audit_logs, :event_type)
    add_index :audit_logs, :created_at unless index_exists?(:audit_logs, :created_at)
    add_index :audit_logs, [ :tenant_id, :event_type, :created_at ] unless index_exists?(:audit_logs, [ :tenant_id, :event_type, :created_at ])
    add_index :audit_logs, :request_id unless index_exists?(:audit_logs, :request_id)
  end

  def ensure_foreign_keys!
    add_foreign_key :audit_logs, :tenants unless foreign_key_exists?(:audit_logs, :tenants)
    add_foreign_key :audit_logs, :users, column: :actor_id unless foreign_key_exists?(:audit_logs, :users, column: :actor_id)
  end
end
