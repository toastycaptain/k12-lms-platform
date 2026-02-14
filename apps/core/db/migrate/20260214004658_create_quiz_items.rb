class CreateQuizItems < ActiveRecord::Migration[8.1]
  def change
    create_table :quiz_items do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.references :quiz, null: false, foreign_key: true, index: true
      t.references :question, null: false, foreign_key: true, index: true
      t.integer :position, null: false, default: 0
      t.decimal :points, null: false, default: 1.0
      t.timestamps
    end

    add_index :quiz_items, [ :quiz_id, :question_id ], unique: true
  end
end
