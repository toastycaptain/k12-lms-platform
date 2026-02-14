class CreateQuestions < ActiveRecord::Migration[8.1]
  def change
    create_table :questions do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.references :question_bank, null: false, foreign_key: true, index: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.string :question_type, null: false
      t.text :prompt, null: false
      t.jsonb :choices, default: {}
      t.jsonb :correct_answer, default: {}
      t.decimal :points, null: false, default: 1.0
      t.text :explanation
      t.integer :position, null: false, default: 0
      t.string :status, null: false, default: "active"
      t.timestamps
    end
  end
end
