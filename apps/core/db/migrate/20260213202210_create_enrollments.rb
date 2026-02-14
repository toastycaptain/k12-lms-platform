class CreateEnrollments < ActiveRecord::Migration[8.1]
  def change
    create_table :enrollments do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.references :user, null: false, foreign_key: true, index: true
      t.references :section, null: false, foreign_key: true, index: true
      t.string :role, null: false

      t.timestamps
    end

    add_index :enrollments, [ :user_id, :section_id ], unique: true
  end
end
