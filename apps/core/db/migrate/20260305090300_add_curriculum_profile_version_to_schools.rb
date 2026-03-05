class AddCurriculumProfileVersionToSchools < ActiveRecord::Migration[8.0]
  def change
    add_column :schools, :curriculum_profile_version, :string
    add_index :schools,
              [ :tenant_id, :curriculum_profile_key, :curriculum_profile_version ],
              name: "idx_schools_tenant_curriculum_profile_version"
  end
end
