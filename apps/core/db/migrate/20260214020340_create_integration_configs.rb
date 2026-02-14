class CreateIntegrationConfigs < ActiveRecord::Migration[8.1]
  def change
    create_table :integration_configs do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.string :provider, null: false
      t.string :status, null: false, default: "inactive"
      t.jsonb :settings, null: false, default: {}
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.timestamps
    end

    add_index :integration_configs, [ :tenant_id, :provider ], unique: true
  end
end
