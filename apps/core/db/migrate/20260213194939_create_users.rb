class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.string :email, null: false
      t.string :first_name
      t.string :last_name

      t.timestamps
    end

    add_index :users, [ :tenant_id, :email ], unique: true
  end
end
