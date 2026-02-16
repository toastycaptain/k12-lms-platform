class CreateLtiResourceLinksMigration < ActiveRecord::Migration[8.0]
  def change
    return if table_exists?(:lti_resource_links)

    create_table :lti_resource_links do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :lti_registration, null: false, foreign_key: true
      t.references :course, foreign_key: true
      t.string :url
      t.string :title, null: false
      t.text :description
      t.jsonb :custom_params, null: false, default: {}
      t.timestamps
    end
  end
end
