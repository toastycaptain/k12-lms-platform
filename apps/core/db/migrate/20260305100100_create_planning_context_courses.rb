class CreatePlanningContextCourses < ActiveRecord::Migration[8.1]
  def change
    create_table :planning_context_courses do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :planning_context, null: false, foreign_key: true
      t.references :course, null: false, foreign_key: true
      t.timestamps
    end

    add_index :planning_context_courses, [ :planning_context_id, :course_id ], unique: true
    add_index :planning_context_courses, [ :tenant_id, :course_id ]
  end
end
