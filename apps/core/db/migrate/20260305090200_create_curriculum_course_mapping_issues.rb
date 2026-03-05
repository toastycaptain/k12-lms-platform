class CreateCurriculumCourseMappingIssues < ActiveRecord::Migration[8.0]
  def change
    create_table :curriculum_course_mapping_issues do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :course, null: false, foreign_key: true
      t.references :resolved_school, foreign_key: { to_table: :schools }
      t.references :resolved_by, foreign_key: { to_table: :users }

      t.string :status, null: false, default: "unresolved"
      t.string :reason, null: false, default: "missing_school_id"
      t.datetime :resolved_at

      t.jsonb :candidate_school_ids, null: false, default: []
      t.jsonb :metadata, null: false, default: {}

      t.timestamps
    end

    add_index :curriculum_course_mapping_issues,
              [ :tenant_id, :status, :created_at ],
              name: "idx_curriculum_course_mapping_issues_state"
    add_index :curriculum_course_mapping_issues,
              [ :tenant_id, :course_id ],
              unique: true,
              name: "idx_curriculum_course_mapping_issues_course"
  end
end
