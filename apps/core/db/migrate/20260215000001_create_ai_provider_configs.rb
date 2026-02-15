class CreateAiProviderConfigs < ActiveRecord::Migration[8.0]
  def up
    unless table_exists?(:ai_provider_configs)
      create_table :ai_provider_configs do |t|
        t.text :api_key
        t.jsonb :available_models, default: [], null: false
        t.bigint :created_by_id, null: false
        t.string :default_model, null: false
        t.string :display_name, null: false
        t.string :provider_name, null: false
        t.jsonb :settings, default: {}, null: false
        t.string :status, default: "inactive", null: false
        t.references :tenant, null: false, foreign_key: true
        t.timestamps
      end

      add_index :ai_provider_configs, [ :tenant_id, :provider_name ], unique: true
      add_index :ai_provider_configs, :created_by_id
      add_foreign_key :ai_provider_configs, :users, column: :created_by_id
    end
  end

  def down
    drop_table :ai_provider_configs, if_exists: true
  end
end
