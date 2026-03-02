class CreateAttendances < ActiveRecord::Migration[8.0]
  def change
    create_table :attendances do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :student, null: false, foreign_key: { to_table: :users }
      t.references :section, null: false, foreign_key: true
      t.references :recorded_by, null: true, foreign_key: { to_table: :users }
      t.date :occurred_on, null: false
      t.string :status, null: false, default: "present"
      t.text :notes

      t.timestamps
    end

    add_index :attendances,
      [ :tenant_id, :student_id, :section_id, :occurred_on ],
      unique: true,
      name: "idx_attendance_unique_student_section_day"
    add_index :attendances,
      [ :tenant_id, :student_id, :occurred_on ],
      name: "idx_attendance_student_day"
    add_index :attendances,
      [ :tenant_id, :section_id, :occurred_on ],
      name: "idx_attendance_section_day"
  end
end
