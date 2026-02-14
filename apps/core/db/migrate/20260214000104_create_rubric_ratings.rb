class CreateRubricRatings < ActiveRecord::Migration[8.1]
  def change
    create_table :rubric_ratings do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.references :rubric_criterion, null: false, foreign_key: { to_table: :rubric_criteria }, index: true
      t.string :description, null: false
      t.decimal :points, null: false
      t.integer :position, default: 0
      t.timestamps
    end
  end
end
