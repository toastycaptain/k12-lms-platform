class RenameFrozenOnCurriculumProfileAssignments < ActiveRecord::Migration[8.0]
  def change
    rename_column :curriculum_profile_assignments, :frozen, :is_frozen

    remove_index :curriculum_profile_assignments, name: "idx_curriculum_profile_assignments_freeze"
    add_index :curriculum_profile_assignments,
              [ :tenant_id, :academic_year_id, :is_frozen, :active ],
              name: "idx_curriculum_profile_assignments_freeze"
  end
end
