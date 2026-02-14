class CreateTemplateVersionStandards < ActiveRecord::Migration[8.1]
  def change
    create_table :template_version_standards do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.references :template_version, null: false, foreign_key: true, index: true
      t.references :standard, null: false, foreign_key: true, index: true

      t.timestamps
    end

    add_index :template_version_standards, [ :template_version_id, :standard_id ], unique: true,
              name: "idx_tmpl_ver_std_unique"
  end
end
