class CreateQuizAccommodations < ActiveRecord::Migration[8.1]
  def change
    create_table :quiz_accommodations do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.references :quiz, null: false, foreign_key: true, index: true
      t.references :user, null: false, foreign_key: true, index: true
      t.integer :extra_time_minutes, null: false, default: 0
      t.integer :extra_attempts, null: false, default: 0
      t.text :notes
      t.timestamps
    end
    add_index :quiz_accommodations, [ :quiz_id, :user_id ], unique: true
  end
end
