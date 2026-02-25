class CreateFeatureFlags < ActiveRecord::Migration[8.1]
  def change
    create_table :feature_flags do |t|
      t.string :key, null: false
      t.boolean :enabled, null: false, default: false
      t.references :tenant, null: true, foreign_key: true
      t.text :description

      t.timestamps
    end

    add_index :feature_flags, [ :key, :tenant_id ], unique: true
    add_index :feature_flags, :key
  end
end
