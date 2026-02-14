class CreateAiInvocations < ActiveRecord::Migration[8.0]
  def change
    create_table :ai_invocations do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.references :user, null: false, foreign_key: true, index: true
      t.references :ai_provider_config, null: false, foreign_key: true
      t.references :ai_task_policy, foreign_key: true
      t.references :ai_template, foreign_key: true
      t.string :task_type, null: false
      t.string :provider_name, null: false
      t.string :model, null: false
      t.string :status, null: false, default: "pending"
      t.integer :prompt_tokens
      t.integer :completion_tokens
      t.integer :total_tokens
      t.integer :duration_ms
      t.string :input_hash
      t.text :error_message
      t.jsonb :context, null: false, default: {}
      t.datetime :started_at
      t.datetime :completed_at
      t.timestamps
    end
    add_index :ai_invocations, [ :tenant_id, :task_type, :created_at ]
  end
end
