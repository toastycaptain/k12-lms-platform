class CreateCurriculumProfileAssignments < ActiveRecord::Migration[8.0]
  def change
    create_table :curriculum_profile_assignments do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, foreign_key: true
      t.references :course, foreign_key: true
      t.references :academic_year, foreign_key: true
      t.references :assigned_by, foreign_key: { to_table: :users }

      t.string :scope_type, null: false
      t.string :profile_key, null: false
      t.string :profile_version
      t.boolean :pinned, null: false, default: false
      t.boolean :frozen, null: false, default: false
      t.boolean :active, null: false, default: true

      t.jsonb :metadata, null: false, default: {}

      t.timestamps
    end

    add_index :curriculum_profile_assignments,
              [ :tenant_id, :scope_type, :active ],
              name: "idx_curriculum_profile_assignments_scope"
    add_index :curriculum_profile_assignments,
              [ :tenant_id, :course_id, :academic_year_id, :active ],
              name: "idx_curriculum_profile_assignments_course_year"
    add_index :curriculum_profile_assignments,
              [ :tenant_id, :school_id, :academic_year_id, :active ],
              name: "idx_curriculum_profile_assignments_school_year"
    add_index :curriculum_profile_assignments,
              [ :tenant_id, :academic_year_id, :frozen, :active ],
              name: "idx_curriculum_profile_assignments_freeze"
  end
end
