class CreateDiscussionPosts < ActiveRecord::Migration[8.1]
  def change
    create_table :discussion_posts do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.references :discussion, null: false, foreign_key: true, index: true
      t.references :parent_post, foreign_key: { to_table: :discussion_posts }, null: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.text :content, null: false
      t.timestamps
    end
  end
end
