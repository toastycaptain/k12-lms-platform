class CreateLessonPlans < ActiveRecord::Migration[8.0]
  def change
    create_table :lesson_plans do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.references :unit_plan, null: false, foreign_key: true, index: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.bigint :current_version_id
      t.string :title, null: false
      t.integer :position, null: false, default: 0
      t.string :status, null: false, default: "draft"

      t.timestamps
    end
  end
end
