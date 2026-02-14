class CreateUnitVersionStandards < ActiveRecord::Migration[8.1]
  def change
    create_table :unit_version_standards do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.references :unit_version, null: false, foreign_key: true, index: true
      t.references :standard, null: false, foreign_key: true, index: true

      t.timestamps
    end

    add_index :unit_version_standards, [ :unit_version_id, :standard_id ], unique: true
  end
end
