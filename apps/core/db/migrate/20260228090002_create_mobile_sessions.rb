class CreateMobileSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :mobile_sessions do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :refresh_token_digest, null: false
      t.datetime :expires_at, null: false
      t.datetime :last_used_at
      t.datetime :revoked_at
      t.string :user_agent
      t.string :ip_address

      t.timestamps
    end

    add_index :mobile_sessions, :refresh_token_digest, unique: true
    add_index :mobile_sessions, %i[tenant_id user_id]
    add_index :mobile_sessions, :expires_at
  end
end
