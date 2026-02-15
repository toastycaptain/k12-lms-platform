class CreateLtiResourceLinks < ActiveRecord::Migration[8.1]
  def up
    create_table :lti_resource_links do |t|
      t.references :lti_registration, null: false, foreign_key: true
      t.references :tenant, null: false, foreign_key: true
      t.references :course, null: true, foreign_key: true
      t.string :title, null: false
      t.text :description
      t.string :url
      t.jsonb :custom_params, null: false, default: {}
      t.timestamps
    end unless table_exists?(:lti_resource_links)

    add_index :lti_resource_links, :course_id unless index_exists?(:lti_resource_links, :course_id)
    add_index :lti_resource_links, :lti_registration_id unless index_exists?(:lti_resource_links, :lti_registration_id)
    add_index :lti_resource_links, :tenant_id unless index_exists?(:lti_resource_links, :tenant_id)

    add_foreign_key :lti_resource_links, :courses unless foreign_key_exists?(:lti_resource_links, :courses)
    add_foreign_key :lti_resource_links, :lti_registrations unless foreign_key_exists?(:lti_resource_links, :lti_registrations)
    add_foreign_key :lti_resource_links, :tenants unless foreign_key_exists?(:lti_resource_links, :tenants)
  end

  def down
    drop_table :lti_resource_links if table_exists?(:lti_resource_links)
  end
end
