class CreateAiTaskPolicies < ActiveRecord::Migration[8.0]
  def up
    unless table_exists?(:ai_task_policies)
      create_table :ai_task_policies do |t|
        t.bigint :ai_provider_config_id, null: false
        t.jsonb :allowed_roles, default: [], null: false
        t.bigint :created_by_id, null: false
        t.boolean :enabled, default: true, null: false
        t.integer :max_tokens_limit, default: 4096
        t.string :model_override
        t.boolean :requires_approval, default: false, null: false
        t.jsonb :settings, default: {}, null: false
        t.string :task_type, null: false
        t.float :temperature_limit, default: 1.0
        t.references :tenant, null: false, foreign_key: true
        t.timestamps
      end

      add_index :ai_task_policies, [ :tenant_id, :task_type ], unique: true
      add_index :ai_task_policies, :ai_provider_config_id
      add_index :ai_task_policies, :created_by_id
      add_foreign_key :ai_task_policies, :ai_provider_configs
      add_foreign_key :ai_task_policies, :users, column: :created_by_id
    end
  end

  def down
    drop_table :ai_task_policies, if_exists: true
  end
end
