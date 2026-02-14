class CreateStandardFrameworks < ActiveRecord::Migration[8.1]
  def change
    create_table :standard_frameworks do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.string :name, null: false
      t.string :jurisdiction
      t.string :subject
      t.string :version

      t.timestamps
    end
  end
end
