class CreateAiTemplates < ActiveRecord::Migration[8.0]
  def up
    unless table_exists?(:ai_templates)
      create_table :ai_templates do |t|
        t.bigint :created_by_id, null: false
        t.string :name, null: false
        t.string :status, default: "draft"
        t.text :system_prompt, null: false
        t.string :task_type, null: false
        t.references :tenant, null: false, foreign_key: true
        t.text :user_prompt_template, null: false
        t.jsonb :variables, default: [], null: false
        t.timestamps
      end

      add_index :ai_templates, [ :tenant_id, :task_type, :status ]
      add_index :ai_templates, :created_by_id
      add_foreign_key :ai_templates, :users, column: :created_by_id
    end
  end

  def down
    drop_table :ai_templates, if_exists: true
  end
end
