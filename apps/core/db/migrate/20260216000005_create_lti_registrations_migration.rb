class CreateLtiRegistrationsMigration < ActiveRecord::Migration[8.0]
  def change
    return if table_exists?(:lti_registrations)

    create_table :lti_registrations do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.string :client_id, null: false
      t.string :deployment_id, null: false
      t.string :issuer, null: false
      t.string :auth_login_url, null: false
      t.string :auth_token_url, null: false
      t.string :jwks_url, null: false
      t.string :name, null: false
      t.text :description
      t.string :status, null: false, default: "inactive"
      t.jsonb :settings, null: false, default: {}
      t.timestamps
    end

    add_index :lti_registrations, [ :tenant_id, :client_id ], unique: true, name: "idx_lti_registrations_tenant_client"
  end
end
