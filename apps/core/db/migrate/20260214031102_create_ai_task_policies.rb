class CreateAiTaskPolicies < ActiveRecord::Migration[8.0]
  def change
    create_table :ai_task_policies do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.string :task_type, null: false
      t.jsonb :allowed_roles, null: false, default: []
      t.references :ai_provider_config, null: false, foreign_key: true
      t.string :model_override
      t.integer :max_tokens_limit, default: 4096
      t.float :temperature_limit, default: 1.0
      t.boolean :requires_approval, null: false, default: false
      t.boolean :enabled, null: false, default: true
      t.jsonb :settings, null: false, default: {}
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.timestamps
    end
    add_index :ai_task_policies, [ :tenant_id, :task_type ], unique: true
  end
end
