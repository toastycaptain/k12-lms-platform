class CreateTenants < ActiveRecord::Migration[8.1]
  def change
    create_table :tenants do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.jsonb :settings, default: {}

      t.timestamps
    end

    add_index :tenants, :slug, unique: true
  end
end
