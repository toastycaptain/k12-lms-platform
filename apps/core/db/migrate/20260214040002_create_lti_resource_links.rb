class CreateLtiResourceLinks < ActiveRecord::Migration[8.1]
  def change
    create_table :lti_resource_links do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.references :lti_registration, null: false, foreign_key: true
      t.string :title, null: false
      t.text :description
      t.string :url
      t.jsonb :custom_params, null: false, default: {}
      t.references :course, null: true, foreign_key: true
      t.timestamps
    end
  end
end
