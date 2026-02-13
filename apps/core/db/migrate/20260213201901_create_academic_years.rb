class CreateAcademicYears < ActiveRecord::Migration[8.1]
  def change
    create_table :academic_years do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.string :name, null: false
      t.date :start_date, null: false
      t.date :end_date, null: false
      t.boolean :current, default: false

      t.timestamps
    end
  end
end
