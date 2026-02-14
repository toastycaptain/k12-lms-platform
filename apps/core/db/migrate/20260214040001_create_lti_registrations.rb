class CreateLtiRegistrations < ActiveRecord::Migration[8.1]
  def change
    create_table :lti_registrations do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.string :name, null: false
      t.text :description
      t.string :issuer, null: false
      t.string :client_id, null: false
      t.string :auth_login_url, null: false
      t.string :auth_token_url, null: false
      t.string :jwks_url, null: false
      t.string :deployment_id, null: false
      t.string :status, null: false, default: "inactive"
      t.jsonb :settings, null: false, default: {}
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.timestamps
    end
  end
end
