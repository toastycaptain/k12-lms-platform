class CreateSectionMeetings < ActiveRecord::Migration[8.1]
  def change
    create_table :section_meetings do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :section, null: false, foreign_key: true
      t.integer :weekday, null: false
      t.time :start_time, null: false
      t.time :end_time, null: false
      t.string :location

      t.timestamps
    end

    add_index :section_meetings, %i[section_id weekday start_time], name: "idx_section_meetings_schedule"
    add_check_constraint :section_meetings, "weekday BETWEEN 0 AND 6", name: "section_meetings_weekday_range"
  end
end
