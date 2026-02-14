class CreateAttemptAnswers < ActiveRecord::Migration[8.1]
  def change
    create_table :attempt_answers do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.references :quiz_attempt, null: false, foreign_key: true, index: true
      t.references :question, null: false, foreign_key: true, index: true
      t.jsonb :answer, null: false, default: {}
      t.boolean :is_correct
      t.decimal :points_awarded
      t.datetime :graded_at
      t.references :graded_by, foreign_key: { to_table: :users }
      t.text :feedback
      t.timestamps
    end
    add_index :attempt_answers, [ :quiz_attempt_id, :question_id ], unique: true, name: "idx_attempt_answers_unique"
  end
end
