class CreateAiProviderConfigs < ActiveRecord::Migration[8.0]
  def change
    create_table :ai_provider_configs do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.string :provider_name, null: false
      t.string :display_name, null: false
      t.string :status, null: false, default: "inactive"
      t.text :api_key
      t.string :default_model, null: false
      t.jsonb :available_models, null: false, default: []
      t.jsonb :settings, null: false, default: {}
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.timestamps
    end
    add_index :ai_provider_configs, [ :tenant_id, :provider_name ], unique: true
  end
end
