class CreateTerms < ActiveRecord::Migration[8.1]
  def change
    create_table :terms do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.references :academic_year, null: false, foreign_key: true, index: true
      t.string :name, null: false
      t.date :start_date, null: false
      t.date :end_date, null: false

      t.timestamps
    end
  end
end
