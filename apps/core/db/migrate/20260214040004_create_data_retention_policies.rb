class CreateDataRetentionPolicies < ActiveRecord::Migration[8.1]
  def change
    create_table :data_retention_policies do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.string :name, null: false
      t.string :entity_type, null: false
      t.integer :retention_days, null: false
      t.string :action, null: false
      t.boolean :enabled, null: false, default: true
      t.jsonb :settings, null: false, default: {}
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.timestamps
    end
  end
end
