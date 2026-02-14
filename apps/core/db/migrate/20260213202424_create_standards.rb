class CreateStandards < ActiveRecord::Migration[8.1]
  def change
    create_table :standards do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.references :standard_framework, null: false, foreign_key: true, index: true
      t.references :parent, null: true, foreign_key: { to_table: :standards }, index: true
      t.string :code, null: false
      t.text :description
      t.string :grade_band

      t.timestamps
    end
  end
end
