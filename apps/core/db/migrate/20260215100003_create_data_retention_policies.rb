class CreateDataRetentionPolicies < ActiveRecord::Migration[8.1]
  def up
    create_table :data_retention_policies do |t|
      t.string :name, null: false
      t.string :entity_type, null: false
      t.string :action, null: false
      t.integer :retention_days, null: false
      t.boolean :enabled, null: false, default: true
      t.jsonb :settings, null: false, default: {}
      t.references :tenant, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.timestamps
    end unless table_exists?(:data_retention_policies)

    add_index :data_retention_policies, :tenant_id unless index_exists?(:data_retention_policies, :tenant_id)
    add_index :data_retention_policies, :created_by_id unless index_exists?(:data_retention_policies, :created_by_id)

    add_foreign_key :data_retention_policies, :tenants unless foreign_key_exists?(:data_retention_policies, :tenants)
    add_foreign_key :data_retention_policies, :users, column: :created_by_id unless foreign_key_exists?(:data_retention_policies, :users, column: :created_by_id)
  end

  def down
    drop_table :data_retention_policies if table_exists?(:data_retention_policies)
  end
end
