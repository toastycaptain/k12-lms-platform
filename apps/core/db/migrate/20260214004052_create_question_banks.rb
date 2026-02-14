class CreateQuestionBanks < ActiveRecord::Migration[8.1]
  def change
    create_table :question_banks do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.string :title, null: false
      t.text :description
      t.string :subject
      t.string :grade_level
      t.string :status, null: false, default: "active"
      t.timestamps
    end
  end
end
