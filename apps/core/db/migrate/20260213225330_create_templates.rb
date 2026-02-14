class CreateTemplates < ActiveRecord::Migration[8.1]
  def change
    create_table :templates do |t|
      t.string :name, null: false
      t.string :subject
      t.string :grade_level
      t.text :description
      t.string :status, null: false, default: "draft"
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.bigint :current_version_id
      t.references :tenant, null: false, foreign_key: true, index: true

      t.timestamps
    end

    create_table :template_versions do |t|
      t.references :template, null: false, foreign_key: true
      t.integer :version_number, null: false
      t.string :title, null: false
      t.text :description
      t.text :essential_questions, array: true, default: []
      t.text :enduring_understandings, array: true, default: []
      t.integer :suggested_duration_weeks
      t.references :tenant, null: false, foreign_key: true, index: true

      t.timestamps
    end

    add_index :template_versions, [ :template_id, :version_number ], unique: true
    add_foreign_key :templates, :template_versions, column: :current_version_id
  end
end
