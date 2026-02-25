class CreateGradeCategories < ActiveRecord::Migration[8.1]
  def change
    create_table :grade_categories do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :course, null: false, foreign_key: true
      t.string :name, null: false
      t.decimal :weight_percentage, precision: 5, scale: 2, null: false, default: 0

      t.timestamps
    end

    add_index :grade_categories, [ :tenant_id, :course_id, :name ], unique: true

    add_reference :assignments, :grade_category, foreign_key: true, null: true unless column_exists?(:assignments, :grade_category_id)
  end
end
