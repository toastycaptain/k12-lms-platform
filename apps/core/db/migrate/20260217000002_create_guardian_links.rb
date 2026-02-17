class CreateGuardianLinks < ActiveRecord::Migration[8.1]
  def change
    create_table :guardian_links do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :guardian, null: false, foreign_key: { to_table: :users }
      t.references :student, null: false, foreign_key: { to_table: :users }
      t.string :relationship, null: false, default: "parent"
      t.string :status, null: false, default: "active"

      t.timestamps
    end

    add_index :guardian_links, [ :tenant_id, :guardian_id, :student_id ], unique: true
  end
end
