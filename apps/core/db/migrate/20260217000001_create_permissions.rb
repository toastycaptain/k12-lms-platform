class CreatePermissions < ActiveRecord::Migration[8.1]
  def change
    create_table :permissions do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :role, null: false, foreign_key: true
      t.string :resource, null: false
      t.string :action, null: false
      t.boolean :granted, null: false, default: false

      t.timestamps
    end

    add_index :permissions, [ :tenant_id, :role_id, :resource, :action ],
      unique: true,
      name: "idx_permissions_unique"
  end
end
