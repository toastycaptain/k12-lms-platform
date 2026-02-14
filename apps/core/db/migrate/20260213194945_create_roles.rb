class CreateRoles < ActiveRecord::Migration[8.1]
  def change
    create_table :roles do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.string :name, null: false

      t.timestamps
    end

    add_index :roles, [ :tenant_id, :name ], unique: true
  end
end
