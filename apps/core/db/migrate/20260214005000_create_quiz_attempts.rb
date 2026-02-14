class CreateQuizAttempts < ActiveRecord::Migration[8.1]
  def change
    create_table :quiz_attempts do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.references :quiz, null: false, foreign_key: true, index: true
      t.references :user, null: false, foreign_key: true, index: true
      t.integer :attempt_number, null: false, default: 1
      t.string :status, null: false, default: "in_progress"
      t.decimal :score
      t.decimal :percentage
      t.datetime :started_at, null: false
      t.datetime :submitted_at
      t.integer :time_spent_seconds
      t.timestamps
    end
    add_index :quiz_attempts, [ :quiz_id, :user_id, :attempt_number ], unique: true, name: "idx_quiz_attempts_unique"
  end
end
