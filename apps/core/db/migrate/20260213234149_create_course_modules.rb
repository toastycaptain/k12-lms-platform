class CreateCourseModules < ActiveRecord::Migration[8.1]
  def change
    create_table :course_modules do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.references :course, null: false, foreign_key: true, index: true
      t.string :title, null: false
      t.text :description
      t.integer :position, null: false, default: 0
      t.string :status, null: false, default: "draft"
      t.datetime :unlock_at
      t.timestamps
    end

    add_index :course_modules, [ :course_id, :position ]
  end
end
