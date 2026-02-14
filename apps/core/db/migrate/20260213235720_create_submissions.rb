class CreateSubmissions < ActiveRecord::Migration[8.1]
  def change
    create_table :submissions do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.references :assignment, null: false, foreign_key: true, index: true
      t.references :user, null: false, foreign_key: true, index: true
      t.string :submission_type
      t.text :body
      t.string :url
      t.string :status, null: false, default: "draft"
      t.datetime :submitted_at
      t.integer :attempt_number, default: 1
      t.decimal :grade
      t.datetime :graded_at
      t.references :graded_by, foreign_key: { to_table: :users }, null: true
      t.text :feedback
      t.timestamps
    end

    add_index :submissions, [ :assignment_id, :user_id ], unique: true
  end
end
