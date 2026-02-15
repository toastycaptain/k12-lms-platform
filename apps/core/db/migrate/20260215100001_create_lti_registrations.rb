class CreateLtiRegistrations < ActiveRecord::Migration[8.1]
  def up
    create_table :lti_registrations do |t|
      t.string :name, null: false
      t.text :description
      t.string :issuer, null: false
      t.string :client_id, null: false
      t.string :deployment_id, null: false
      t.string :auth_login_url, null: false
      t.string :auth_token_url, null: false
      t.string :jwks_url, null: false
      t.string :status, null: false, default: "inactive"
      t.jsonb :settings, null: false, default: {}
      t.references :tenant, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.timestamps
    end unless table_exists?(:lti_registrations)

    add_index :lti_registrations, [ :tenant_id, :client_id ], name: "idx_lti_registrations_tenant_client" unless index_exists?(:lti_registrations, [ :tenant_id, :client_id ], name: "idx_lti_registrations_tenant_client")
    add_index :lti_registrations, :tenant_id unless index_exists?(:lti_registrations, :tenant_id)
    add_index :lti_registrations, :created_by_id unless index_exists?(:lti_registrations, :created_by_id)

    add_foreign_key :lti_registrations, :tenants unless foreign_key_exists?(:lti_registrations, :tenants)
    add_foreign_key :lti_registrations, :users, column: :created_by_id unless foreign_key_exists?(:lti_registrations, :users, column: :created_by_id)
  end

  def down
    drop_table :lti_registrations if table_exists?(:lti_registrations)
  end
end
