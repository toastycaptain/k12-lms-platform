class CreateRubricCriteria < ActiveRecord::Migration[8.1]
  def change
    create_table :rubric_criteria do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.references :rubric, null: false, foreign_key: true, index: true
      t.string :title, null: false
      t.text :description
      t.decimal :points, null: false
      t.integer :position, default: 0
      t.timestamps
    end
  end
end
