class CreateAiInvocations < ActiveRecord::Migration[8.0]
  def up
    unless table_exists?(:ai_invocations)
      create_table :ai_invocations do |t|
        t.bigint :ai_provider_config_id, null: false
        t.bigint :ai_task_policy_id
        t.bigint :ai_template_id
        t.datetime :completed_at
        t.integer :completion_tokens
        t.jsonb :context, default: {}, null: false
        t.integer :duration_ms
        t.text :error_message
        t.string :input_hash
        t.string :model, null: false
        t.integer :prompt_tokens
        t.string :provider_name, null: false
        t.datetime :started_at
        t.string :status, default: "pending", null: false
        t.string :task_type, null: false
        t.references :tenant, null: false, foreign_key: true
        t.integer :total_tokens
        t.bigint :user_id, null: false
        t.timestamps
      end

      add_index :ai_invocations, :ai_provider_config_id
      add_index :ai_invocations, :ai_task_policy_id
      add_index :ai_invocations, :ai_template_id
      add_index :ai_invocations, [ :tenant_id, :task_type, :created_at ]
      add_index :ai_invocations, :user_id
      add_foreign_key :ai_invocations, :ai_provider_configs
      add_foreign_key :ai_invocations, :ai_task_policies
      add_foreign_key :ai_invocations, :ai_templates
      add_foreign_key :ai_invocations, :users
    end
  end

  def down
    drop_table :ai_invocations, if_exists: true
  end
end
