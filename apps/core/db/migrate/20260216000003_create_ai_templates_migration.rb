class CreateAiTemplatesMigration < ActiveRecord::Migration[8.0]
  def change
    return if table_exists?(:ai_templates)

    create_table :ai_templates do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.string :task_type, null: false
      t.string :name, null: false
      t.string :status, null: false, default: "draft"
      t.text :system_prompt, null: false
      t.text :user_prompt_template, null: false
      t.jsonb :variables, null: false, default: []
      t.timestamps
    end

    add_index :ai_templates, [ :tenant_id, :task_type, :status ]
  end
end
