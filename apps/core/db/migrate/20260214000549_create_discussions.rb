class CreateDiscussions < ActiveRecord::Migration[8.1]
  def change
    create_table :discussions do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.references :course, null: false, foreign_key: true, index: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.string :title, null: false
      t.text :description
      t.string :status, null: false, default: "open"
      t.boolean :pinned, default: false
      t.boolean :require_initial_post, default: false
      t.timestamps
    end
  end
end
