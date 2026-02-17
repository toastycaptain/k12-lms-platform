class CreateDistricts < ActiveRecord::Migration[8.1]
  def change
    create_table :districts do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.jsonb :settings, null: false, default: {}
      t.timestamps
    end

    add_index :districts, :slug, unique: true

    add_reference :tenants, :district, foreign_key: true unless column_exists?(:tenants, :district_id)
    add_column :users, :district_admin, :boolean, null: false, default: false unless column_exists?(:users, :district_admin)
  end
end
