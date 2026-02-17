class CreateQuestionVersions < ActiveRecord::Migration[8.1]
  def change
    create_table :question_versions do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :question, null: false, foreign_key: true
      t.integer :version_number, null: false, default: 1
      t.string :question_type, null: false
      t.text :content, null: false
      t.jsonb :choices, null: false, default: []
      t.jsonb :correct_answer
      t.text :explanation
      t.decimal :points, precision: 8, scale: 2, null: false, default: 1.0
      t.jsonb :metadata, null: false, default: {}
      t.string :status, null: false, default: "draft"
      t.references :created_by, foreign_key: { to_table: :users }

      t.timestamps
    end

    add_index :question_versions, [ :question_id, :version_number ], unique: true

    add_reference :questions, :current_version, foreign_key: { to_table: :question_versions, on_delete: :nullify }
  end
end
