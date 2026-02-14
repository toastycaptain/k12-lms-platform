class CreateRubrics < ActiveRecord::Migration[8.1]
  def change
    create_table :rubrics do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.string :title, null: false
      t.text :description
      t.decimal :points_possible
      t.timestamps
    end

    add_foreign_key :assignments, :rubrics, column: :rubric_id
  end
end
