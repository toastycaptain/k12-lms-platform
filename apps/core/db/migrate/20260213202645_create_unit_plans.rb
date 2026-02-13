class CreateUnitPlans < ActiveRecord::Migration[8.1]
  def change
    create_table :unit_plans do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.references :course, null: false, foreign_key: true, index: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }, index: true
      t.string :title, null: false
      t.string :status, null: false, default: "draft"
      t.bigint :current_version_id

      t.timestamps
    end

    add_index :unit_plans, :current_version_id
  end
end
