class CreateCourses < ActiveRecord::Migration[8.1]
  def change
    create_table :courses do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.references :academic_year, null: false, foreign_key: true, index: true
      t.string :name, null: false
      t.string :code
      t.text :description

      t.timestamps
    end
  end
end
