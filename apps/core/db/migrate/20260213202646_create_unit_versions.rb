class CreateUnitVersions < ActiveRecord::Migration[8.1]
  def change
    create_table :unit_versions do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.references :unit_plan, null: false, foreign_key: true, index: true
      t.integer :version_number, null: false
      t.string :title, null: false
      t.text :description
      t.text :essential_questions, array: true, default: []
      t.text :enduring_understandings, array: true, default: []

      t.timestamps
    end

    add_index :unit_versions, [ :unit_plan_id, :version_number ], unique: true

    add_foreign_key :unit_plans, :unit_versions, column: :current_version_id
  end
end
