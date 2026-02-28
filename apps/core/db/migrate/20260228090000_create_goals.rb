class CreateGoals < ActiveRecord::Migration[8.1]
  def change
    create_table :goals do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :student, null: false, foreign_key: { to_table: :users }
      t.string :title, null: false
      t.text :description
      t.string :status, null: false, default: "active"
      t.date :target_date
      t.integer :progress_percent, null: false, default: 0

      t.timestamps
    end

    add_index :goals, %i[tenant_id student_id status]
    add_check_constraint :goals, "progress_percent BETWEEN 0 AND 100", name: "goals_progress_percent_range"
  end
end
