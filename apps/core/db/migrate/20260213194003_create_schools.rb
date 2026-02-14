class CreateSchools < ActiveRecord::Migration[8.1]
  def change
    create_table :schools do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.string :name, null: false
      t.text :address
      t.string :timezone

      t.timestamps
    end
  end
end
