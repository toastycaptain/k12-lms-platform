class CreateAuditLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :audit_logs do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :user, null: true, foreign_key: true
      t.string :action, null: false
      t.string :auditable_type
      t.bigint :auditable_id
      t.jsonb :changes_data, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.string :ip_address
      t.string :user_agent
      t.datetime :created_at, null: false
    end

    add_index :audit_logs, [ :tenant_id, :created_at ]
    add_index :audit_logs, [ :tenant_id, :auditable_type, :auditable_id ], name: "index_audit_logs_on_tenant_and_auditable"
  end
end
