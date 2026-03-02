class AddCurriculumProfileFields < ActiveRecord::Migration[8.0]
  def change
    add_column :schools, :curriculum_profile_key, :string
    add_index :schools, [ :tenant_id, :curriculum_profile_key ], name: "idx_schools_tenant_curriculum_profile"

    add_reference :courses, :school, null: true, foreign_key: true
  end
end
