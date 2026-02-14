class CreateModuleItems < ActiveRecord::Migration[8.1]
  def change
    create_table :module_items do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.references :course_module, null: false, foreign_key: true, index: true
      t.string :title, null: false
      t.string :item_type, null: false
      t.string :itemable_type
      t.bigint :itemable_id
      t.integer :position, null: false, default: 0
      t.timestamps
    end

    add_index :module_items, [ :itemable_type, :itemable_id ]
    add_index :module_items, [ :course_module_id, :position ]
  end
end
