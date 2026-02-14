class CreateResourceLinks < ActiveRecord::Migration[8.0]
  def change
    create_table :resource_links do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.references :linkable, polymorphic: true, null: false, index: true
      t.string :url, null: false
      t.string :title
      t.string :mime_type
      t.string :drive_file_id
      t.string :provider, null: false, default: "url"

      t.timestamps
    end
  end
end
