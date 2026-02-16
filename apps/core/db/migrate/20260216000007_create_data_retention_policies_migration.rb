class CreateDataRetentionPoliciesMigration < ActiveRecord::Migration[8.0]
  def change
    return if table_exists?(:data_retention_policies)

    create_table :data_retention_policies do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.string :name, null: false
      t.string :entity_type, null: false
      t.string :action, null: false
      t.integer :retention_days, null: false
      t.boolean :enabled, null: false, default: true
      t.jsonb :settings, null: false, default: {}
      t.timestamps
    end
  end
end
