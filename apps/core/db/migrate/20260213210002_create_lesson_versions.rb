class CreateLessonVersions < ActiveRecord::Migration[8.0]
  def change
    create_table :lesson_versions do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.references :lesson_plan, null: false, foreign_key: true, index: true
      t.integer :version_number, null: false
      t.string :title, null: false
      t.text :objectives
      t.text :activities
      t.text :materials
      t.integer :duration_minutes

      t.timestamps
    end

    add_index :lesson_versions, [ :lesson_plan_id, :version_number ], unique: true
    add_foreign_key :lesson_plans, :lesson_versions, column: :current_version_id
  end
end
