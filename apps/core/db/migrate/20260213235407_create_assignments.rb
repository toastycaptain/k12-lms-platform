class CreateAssignments < ActiveRecord::Migration[8.1]
  def change
    create_table :assignments do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.references :course, null: false, foreign_key: true, index: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.string :title, null: false
      t.text :description
      t.text :instructions
      t.string :assignment_type, null: false
      t.decimal :points_possible
      t.datetime :due_at
      t.datetime :unlock_at
      t.datetime :lock_at
      t.text :submission_types, array: true, default: []
      t.boolean :allow_late_submission, default: true
      t.string :status, null: false, default: "draft"
      t.bigint :rubric_id, null: true
      t.index :rubric_id
      t.timestamps
    end
  end
end
