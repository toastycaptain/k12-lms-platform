class CreateAssignmentStandards < ActiveRecord::Migration[8.1]
  def change
    unless table_exists?(:assignment_standards)
      create_table :assignment_standards do |t|
        t.references :tenant, null: false, foreign_key: true, index: true
        t.references :assignment, null: false, foreign_key: true
        t.references :standard, null: false, foreign_key: true

        t.timestamps
      end

      add_index :assignment_standards, [ :assignment_id, :standard_id ], unique: true
    end
  end
end
