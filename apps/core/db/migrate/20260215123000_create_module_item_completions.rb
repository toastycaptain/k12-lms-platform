class CreateModuleItemCompletions < ActiveRecord::Migration[8.1]
  def change
    return if table_exists?(:module_item_completions)

    create_table :module_item_completions do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.references :module_item, null: false, foreign_key: true
      t.datetime :completed_at, null: false

      t.timestamps
    end

    unless index_exists?(:module_item_completions, [ :user_id, :module_item_id ], unique: true)
      add_index :module_item_completions, [ :user_id, :module_item_id ], unique: true
    end
  end
end
