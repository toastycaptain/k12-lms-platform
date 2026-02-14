class CreateQuizzes < ActiveRecord::Migration[8.1]
  def change
    create_table :quizzes do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.references :course, null: false, foreign_key: true, index: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.string :title, null: false
      t.text :description
      t.text :instructions
      t.string :quiz_type, null: false, default: "standard"
      t.integer :time_limit_minutes
      t.integer :attempts_allowed, null: false, default: 1
      t.boolean :shuffle_questions, null: false, default: false
      t.boolean :shuffle_choices, null: false, default: false
      t.string :show_results, null: false, default: "after_submit"
      t.decimal :points_possible
      t.datetime :due_at
      t.datetime :unlock_at
      t.datetime :lock_at
      t.string :status, null: false, default: "draft"
      t.timestamps
    end
  end
end
